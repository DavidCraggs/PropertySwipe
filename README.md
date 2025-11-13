# PropertySwipe 🏡

A modern Tinder-style UK property discovery application built with React, TypeScript, and Vite. Swipe right to like properties, left to pass, and get matched with sellers for your perfect home.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Features

- **Swipe Interface**: Intuitive Tinder-style card swiping for property discovery
- **Smart Matching**: Get matched with sellers when you like their properties
- **Rich Property Details**: Comprehensive property information including images, EPC ratings, and features
- **Real-time Messaging**: Chat with sellers after matching
- **Advanced Filters**: Search by location, price range, bedrooms, property type, and more
- **Responsive Design**: Optimized for mobile, tablet, and desktop viewing
- **Smooth Animations**: Production-quality animations with Framer Motion
- **Persistent State**: Save preferences and matches with local storage
- **Accessibility**: WCAG AA compliant with keyboard navigation and screen reader support

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 4.x with custom design tokens
- **State Management**: Zustand (lightweight state management)
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Code Quality**: ESLint + Prettier

### Project Structure

```
src/
├── components/           # React components (Atomic Design)
│   ├── atoms/           # Basic building blocks (Button, Input, Badge, etc.)
│   ├── molecules/       # Simple component combinations
│   └── organisms/       # Complex UI sections (PropertyCard, Navigation, etc.)
├── pages/               # Route-level components
│   ├── SwipePage.tsx
│   ├── MatchesPage.tsx
│   ├── ProfilePage.tsx
│   └── OnboardingPage.tsx
├── hooks/               # Custom React hooks
│   ├── useAppStore.ts   # Zustand store hook
│   ├── usePropertyDeck.ts
│   └── usePreferences.ts
├── context/             # React context providers (if needed)
├── types/               # TypeScript type definitions
│   └── index.ts         # Core interfaces (Property, User, Match, etc.)
├── utils/               # Utility functions
│   ├── formatters.ts    # Price, date formatting
│   ├── filters.ts       # Property filtering logic
│   └── validation.ts    # Form validation
├── data/                # Mock data
│   └── mockProperties.ts # 25+ UK property listings
├── services/            # API services (future)
└── assets/              # Static assets (images, fonts)
```

### Component Architecture (Atomic Design)

**Atoms** - Basic UI elements:
- Button, Input, Badge, Icon, Typography

**Molecules** - Simple combinations:
- PropertyCard, FilterChip, StatCard, MessageBubble

**Organisms** - Complex sections:
- SwipeableCard, CardStack, PropertyDetailsModal, NavigationBar, ChatInterface

**Pages** - Route-level views:
- SwipePage, MatchesPage, ProfilePage, OnboardingPage

### State Management

The application uses **Zustand** for lightweight, performant state management:

```typescript
// Store Structure
{
  user: User,                      // Current user profile
  properties: Property[],          // Available properties
  likedProperties: string[],       // IDs of liked properties
  matches: Match[],                // User's matches
  messages: { [matchId]: Message[] }, // Chat messages
  preferences: UserPreferences,    // Filter preferences

  // Actions
  handleLike: (propertyId) => void,
  handleDislike: (propertyId) => void,
  checkForMatch: (propertyId) => void,
  sendMessage: (matchId, content) => void,
  updatePreferences: (prefs) => void
}
```

### Data Flow

1. **User opens app** → Check localStorage for existing user → Load or show onboarding
2. **User sets preferences** → Filter properties based on preferences → Show property deck
3. **User swipes right** → Add to liked properties → Check for match (30% probability for demo)
4. **Match occurs** → Create Match object → Show celebration modal → Enable messaging
5. **User sends message** → Update messages in store → Persist to localStorage

### TypeScript Types

Core interfaces include:

- **Property**: Full property details (address, price, images, features, EPC rating, etc.)
- **User**: User profile with preferences, liked properties, and matches
- **Match**: Match data linking property, seller, and buyer with messages
- **UserPreferences**: Filter criteria (location, price range, bedrooms, property type)
- **Message**: Chat message structure
- **SwipeEvent**: Tracking swipe actions

See [src/types/index.ts](src/types/index.ts) for complete type definitions.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Modern browser with ES6+ support

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/propertyswipe.git
cd propertyswipe

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build production bundle
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## 🎨 Design System

### Color Palette

The application uses a property-focused color scheme:

- **Primary** (Blue): Main brand color for CTAs and highlights
- **Success** (Green): Like actions, positive feedback
- **Danger** (Red): Dislike actions, errors
- **Neutral** (Gray): Text, backgrounds, borders

### Typography

- **Font**: Inter (system fallback: -apple-system, sans-serif)
- **Scale**: Tailwind's default scale with custom additions

### Spacing & Layout

- **Mobile-first**: Designed for 320px+ screens
- **Breakpoints**: sm(640px), md(768px), lg(1024px), xl(1280px)
- **Safe areas**: iOS notch and bottom bar support

### Animations

- **Swipe gestures**: Spring physics for natural feel
- **Page transitions**: Smooth 300ms animations
- **Micro-interactions**: Button press feedback, loading states
- **Performance**: 60fps target with GPU acceleration

## 📱 Features Roadmap

### Phase 1 (Current - Foundation)
- ✅ Project setup with Vite + React + TypeScript
- ✅ Tailwind CSS configuration
- ✅ TypeScript interfaces and types
- ✅ Mock data (25 UK properties)
- ✅ Professional folder structure

### Phase 2 (Core Features)
- ⬜ Swipeable card component
- ⬜ Property details modal
- ⬜ Image gallery with zoom
- ⬜ Like/dislike controls
- ⬜ State management with Zustand

### Phase 3 (Matching & Communication)
- ⬜ Matching logic
- ⬜ Matches page
- ⬜ Chat interface
- ⬜ New match celebrations

### Phase 4 (Personalization)
- ⬜ User profile page
- ⬜ Preference management
- ⬜ Onboarding flow
- ⬜ Statistics dashboard

### Phase 5 (Polish & Performance)
- ⬜ Loading states & skeletons
- ⬜ Empty states
- ⬜ Toast notifications
- ⬜ Accessibility improvements
- ⬜ Performance optimization
- ⬜ Unit & integration tests

### Phase 6 (Future Enhancements)
- ⬜ Real property API integration
- ⬜ User authentication
- ⬜ Advanced search filters
- ⬜ Map view
- ⬜ Saved searches
- ⬜ Property comparisons
- ⬜ Mortgage calculator

## 🧪 Testing

### Unit & Integration Tests (Vitest)
```bash
npm run test           # Watch mode
npm run test:run       # Run once
npm run test:coverage  # With coverage
npm run test:ui        # Interactive UI
```

### E2E Tests (Playwright)
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:headed    # See browser
npm run test:e2e:debug     # Debug mode
npm run test:e2e:report    # View test report
npm run test:e2e:codegen   # Generate tests
```

**Test Coverage:**
- ✅ **20 unit/integration test files** (525 tests with Vitest)
- ✅ **7 E2E test files** (26 tests with Playwright)
- ✅ **Total: 551+ tests** covering all critical flows

**E2E Tests Cover:**
- Authentication (renter, landlord, agency signup/login)
- RRA 2025 compliance enforcement
- Property creation and management
- Swipe and match flows
- Navigation and session persistence

See [tests/e2e/README.md](tests/e2e/README.md) for E2E testing documentation.

## 🔐 Admin Access

### Admin Login
For development and testing, access the admin portal via hash-based routing:
```
http://localhost:5173/#/admin-login
```

**Default Credentials:**
- Email: `admin@geton.com`
- Password: `Admin1234!`

### Role Switching
The admin panel allows switching between all user roles:
- **Renter** - Test property browsing and matching flow
- **Landlord** - Test property management and tenant selection
- **Estate Agent** - Test property marketing and client management
- **Management Agency** - Test maintenance and tenant issue handling

Each role has a pre-populated test profile with realistic, RRA 2025-compliant data.

### Features
- ✅ One-click role switching without logout
- ✅ Visual admin mode indicator showing current role
- ✅ Complete test profiles for each user type
- ✅ Session persistence across page reloads
- ✅ Instant return to role selector dashboard

### Security Note
⚠️ **For development use only.** See [ADMIN_SECURITY.md](ADMIN_SECURITY.md) for production security requirements.

### How It Works
1. Visit `#/admin-login` or click "Admin Access" on login page
2. Enter admin credentials
3. View role selector dashboard
4. Click any role card to impersonate that user
5. Purple admin banner shows at top with "Exit Role" button
6. Test the platform from that user's perspective
7. Exit to switch to another role or logout

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_ANALYTICS=false
```

### Tailwind Configuration

Custom theme configuration in [tailwind.config.js](tailwind.config.js):
- Extended color palette
- Custom animations
- Design tokens
- Utility classes

### ESLint & Prettier

- ESLint: React-specific rules + TypeScript support
- Prettier: Code formatting with sensible defaults
- Run `npm run lint` to check, `npm run format` to fix

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

Output directory: `dist/`

### Deployment Options

**Vercel** (Recommended):
```bash
vercel --prod
```

**Netlify**:
```bash
netlify deploy --prod
```

**Traditional hosting**:
Upload `dist/` folder to any static hosting provider.

### Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90
- Bundle size: < 300KB (gzipped)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Use TypeScript strict mode
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
- Update tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- Property images from [Unsplash](https://unsplash.com)
- Icons from [Lucide](https://lucide.dev)
- Inspired by modern dating apps and property portals

## 📞 Contact

For questions or feedback, please open an issue on GitHub.

---

Built with ❤️ using React, TypeScript, and Vite
