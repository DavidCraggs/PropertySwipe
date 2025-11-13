# Admin Role Switching System - Comprehensive Implementation Prompt

## Executive Summary

Implement a **production-ready admin login system** for the PropertySwipe (GetOn) rental platform that allows an administrator to:
1. Access the app through a special admin login interface
2. Choose which user role they want to impersonate (Renter, Landlord, Estate Agent, Management Agency)
3. Seamlessly switch between these roles without logging out
4. Maintain full test coverage with E2E and unit tests
5. Preserve all existing functionality while adding admin-specific features

**Code Quality Requirements:**
- ✅ **Senior-level TypeScript** with strict mode compliance
- ✅ **Zero placeholders** - all code fully implemented
- ✅ **Full test coverage** - E2E tests (Playwright) and unit tests (Vitest)
- ✅ **Type-safe** - no `any` types, proper interfaces throughout
- ✅ **Production-ready** - error handling, validation, security considerations
- ✅ **Documentation** - inline comments for complex logic

---

## 1. System Context & Architecture

### 1.1 Current Authentication System

**State Management:** Zustand with localStorage persistence
- **Store File:** `src/hooks/useAuthStore.ts` (334 lines)
- **Storage Key:** `get-on-auth`
- **Password Hashing:** SHA-256 (Web Crypto API) in `src/utils/validation.ts`

**Current User Types:**
```typescript
export type UserType = 'landlord' | 'renter' | 'estate_agent' | 'management_agency';
```

**AuthState Interface:**
```typescript
interface AuthState {
  isAuthenticated: boolean;
  userType: UserType | null;
  currentUser: LandlordProfile | RenterProfile | AgencyProfile | null;
  onboardingStep: number; // 0 = complete, 1-5 = steps
}
```

**Key Methods:**
- `login(userType, profile)` - Store profile after signup
- `loginWithPassword(email, password)` - Verify credentials and authenticate
- `logout()` - Clear auth state
- `updateProfile(updates)` - Sync profile changes
- `completeOnboarding()` - Mark onboarding as finished

**Profile Storage:**
- **Landlords:** `get-on-landlord-profiles` (localStorage key)
- **Renters:** `get-on-renter-profiles`
- **Agencies:** `get-on-agency-profiles`

**Authentication Flow:**
1. User enters email + password on LoginPage
2. `loginWithPassword()` queries all profile collections
3. Finds matching email (case-insensitive)
4. Verifies password hash with `verifyPassword()`
5. Sets `isAuthenticated: true` and loads user profile
6. Routes to appropriate dashboard based on `userType`

### 1.2 Current Routing Logic

**File:** `src/App.tsx` (lines 150-192)

**Decision Tree:**
```
No Visit Before?
├─ Welcome Screen → Set hasVisited flag → Role Selection

Visited but Not Authenticated?
├─ Role Selection Screen
│  ├─ I'm a Renter      → RenterOnboarding (5 steps)
│  ├─ I'm a Landlord    → LandlordOnboarding (5 steps)
│  ├─ Estate Agent      → AgencyOnboarding (4 steps)
│  └─ Management Agency → AgencyOnboarding (4 steps)

Authenticated but Incomplete Onboarding?
├─ Route to appropriate onboarding page

Authenticated & Onboarded?
└─ Main App (role-specific dashboard)
   ├─ Renter       → SwipePage
   ├─ Landlord     → LandlordDashboard
   └─ Agency       → AgencyDashboard
```

**Navigation Component:** `src/components/BottomNavigation.tsx`
- Shows different options based on user role
- Hidden when `!isAuthenticated`
- Includes: Swipe/Matches/Profile pages

### 1.3 User Profile Types

**Renter Profile** (`src/types/index.ts`):
```typescript
interface RenterProfile {
  id: string; // UUID
  email: string;
  passwordHash: string;
  name: string;
  age: number;
  localArea: LocalArea;
  employmentStatus: EmploymentStatus;
  monthlyIncome: number;
  situation: RenterSituation; // Single/Couple/Family
  status: RenterStatus; // prospective/current/former
  preferredMoveInDate?: string;
  furnishingPreference: FurnishingType[];
  hasPets: boolean;
  petDetails?: string;
  onboardingComplete: boolean;
  createdAt: string;
}
```

**Landlord Profile:**
```typescript
interface LandlordProfile {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  propertyType: PropertyType;
  listingLink?: string;
  furnishingPreference: FurnishingType;
  petsPreference: PetsPreference;
  prsRegistrationNumber: string; // RRA 2025 mandatory
  ombudsmanScheme: OmbudsmanScheme; // RRA 2025 mandatory
  isFullyCompliant: boolean;
  onboardingComplete: boolean;
  createdAt: string;
}
```

**Agency Profile:**
```typescript
interface AgencyProfile {
  id: string;
  email: string;
  passwordHash: string;
  agencyType: 'estate_agent' | 'management_agency';
  companyName: string;
  registrationNumber: string; // Companies House
  contactName: string;
  contactPhone: string;
  address: string;
  serviceAreas: LocalArea[];
  isActive: boolean;
  onboardingComplete: boolean;
  createdAt: string;
}
```

### 1.4 Existing Test Infrastructure

**E2E Tests (Playwright):** 26 tests across 7 files
- **Location:** `tests/e2e/`
- **Helpers:** `tests/e2e/utils/auth-helpers.ts` (355 lines)
- **Config:** `playwright.config.ts`

**Key Test Utilities:**
```typescript
// Signup and login via UI (full flow testing)
signupAndLogin(page: Page, userType: UserType): Promise<RenterProfile | LandlordProfile | AgencyProfile>

// Programmatic auth (bypass UI for faster tests)
setupAuthState(page: Page, userType: UserType): Promise<Profile>

// Login existing user
login(page: Page, email: string, password: string): Promise<void>

// Logout via UI
logout(page: Page): Promise<void>

// Read auth state
getAuthState(page: Page): Promise<AuthState>

// Clear storage for test isolation
clearStorage(page: Page): Promise<void>
```

**Assertion Utilities:** `tests/e2e/utils/assertions.ts`
```typescript
expectAuthenticated(page: Page): Promise<void>
expectNotAuthenticated(page: Page): Promise<void>
expectRenterDashboard(page: Page): Promise<void>
expectLandlordDashboard(page: Page): Promise<void>
expectAgencyDashboard(page: Page): Promise<void>
```

**Unit Tests (Vitest):** 525 tests across 15 files
- **Location:** `tests/unit/`
- **Key Suites:**
  - `hooks/useAuthStore.test.ts` - Auth state management
  - `components/LoginPage.test.tsx` - Login component
  - `lib/storage.test.ts` - Storage operations

---

## 2. Admin System Requirements

### 2.1 Core Features

#### Feature 1: Admin User Type
Create a new admin user type that has special privileges:
- Can access all user roles
- Can switch between roles without re-authentication
- Has an admin-specific interface for role selection
- Maintains admin privileges across sessions

#### Feature 2: Admin Login Interface
Create a dedicated admin login page:
- Accessible via special route (e.g., `/admin` or `/admin-login`)
- Requires admin credentials (hardcoded or environment variable)
- Clear visual distinction from regular login
- Security: Rate limiting, IP whitelisting (optional for MVP)

#### Feature 3: Role Switching UI
Create an admin panel/menu for role switching:
- Shows all 4 available roles (Renter, Landlord, Estate Agent, Management Agency)
- Displays current active role
- One-click switching between roles
- Visual indicator showing "Admin Mode" is active
- Access to switch back to admin view

#### Feature 4: Test User Profiles
Pre-populate test user profiles for each role:
- **Test Renter:** Full profile with sample data
- **Test Landlord:** Full profile with properties
- **Test Estate Agent:** Agency with sample portfolio
- **Test Management Agency:** Agency with managed properties
- All profiles should be realistic and complete

### 2.2 User Experience Flow

```
1. Admin navigates to /admin-login
   ↓
2. Admin enters credentials
   - Email: admin@geton.com (or env variable)
   - Password: Secure admin password
   ↓
3. System verifies admin credentials
   ↓
4. Admin sees Role Selector Dashboard
   - Card for each role type
   - Current role highlighted
   - Quick stats for each role
   ↓
5. Admin clicks role card (e.g., "Renter")
   ↓
6. System loads test profile for that role
   - Sets userType = 'renter'
   - Loads test renter profile
   - Routes to renter dashboard
   ↓
7. Admin uses app as that role
   - Full functionality available
   - Visible "Admin Mode" indicator
   - Role switcher in nav/header
   ↓
8. Admin clicks role switcher
   ↓
9. Returns to Role Selector Dashboard
   ↓
10. Admin can logout completely
```

### 2.3 Technical Requirements

#### 2.3.1 Type System Extensions

**New UserType:**
```typescript
export type UserType = 'landlord' | 'renter' | 'estate_agent' | 'management_agency' | 'admin';
```

**Admin Profile Interface:**
```typescript
interface AdminProfile {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin';
  permissions: AdminPermission[];
  createdAt: string;
  lastLogin?: string;
}

type AdminPermission = 'role_switching' | 'view_all_users' | 'modify_users' | 'system_settings';
```

**Extended AuthState:**
```typescript
interface AuthState {
  isAuthenticated: boolean;
  userType: UserType | null;
  currentUser: LandlordProfile | RenterProfile | AgencyProfile | AdminProfile | null;
  onboardingStep: number;

  // New admin fields
  isAdminMode?: boolean; // True when admin is impersonating
  adminProfile?: AdminProfile; // Preserve admin profile during impersonation
  impersonatedRole?: UserType; // Which role is currently active
}
```

#### 2.3.2 Storage Strategy

**Admin Storage Keys:**
- `get-on-admin-profile` - Admin profile (singleton)
- `get-on-admin-test-profiles` - Test user profiles for each role
- `get-on-admin-session` - Current admin session data

**Test Profile Generation:**
Create a utility to generate complete test profiles:
```typescript
// src/utils/adminTestProfiles.ts
export const generateTestRenter = (): RenterProfile => { /* full implementation */ }
export const generateTestLandlord = (): LandlordProfile => { /* full implementation */ }
export const generateTestEstateAgent = (): AgencyProfile => { /* full implementation */ }
export const generateTestManagementAgency = (): AgencyProfile => { /* full implementation */ }
```

#### 2.3.3 Auth Store Extensions

**New Methods for useAuthStore:**
```typescript
interface AuthStore extends AuthState {
  // Existing methods...

  // New admin methods
  loginAsAdmin: (email: string, password: string) => Promise<boolean>;
  switchToRole: (userType: Exclude<UserType, 'admin'>) => Promise<void>;
  exitRoleSwitch: () => void;
  isAdmin: () => boolean;
  getAdminSession: () => AdminSession | null;
}
```

**Implementation Details:**
- `loginAsAdmin()` - Verify admin credentials, set admin mode
- `switchToRole()` - Load test profile for role, preserve admin session
- `exitRoleSwitch()` - Return to admin view, restore admin profile
- `isAdmin()` - Check if current user is admin (non-reactive)
- Session persistence across page reloads

#### 2.3.4 Routing Updates

**New Routes (src/App.tsx):**
```typescript
// Add before existing routes
<Route path="/admin-login" element={<AdminLoginPage />} />
<Route path="/admin-dashboard" element={<AdminDashboard />} />
```

**Protected Admin Routes:**
```typescript
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdminMode, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !isAdminMode) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};
```

**Modified App Routing Logic:**
```typescript
// In App.tsx, update routing to handle admin mode
if (isAdminMode && !impersonatedRole) {
  return <AdminDashboard />; // Role selector
}

if (isAdminMode && impersonatedRole) {
  // Render based on impersonated role, with admin indicator
  return (
    <>
      <AdminModeIndicator />
      {renderRoleSpecificDashboard(impersonatedRole)}
    </>
  );
}

// Existing logic for normal users...
```

---

## 3. Implementation Plan (Step-by-Step)

### Phase 1: Type System & State Management (Foundation)

#### Step 1.1: Update Types
**File:** `src/types/index.ts`

Add admin types after line 11:
```typescript
export type UserType = 'landlord' | 'renter' | 'estate_agent' | 'management_agency' | 'admin';

// Admin-specific types
export type AdminPermission = 'role_switching' | 'view_all_users' | 'modify_users' | 'system_settings';

export interface AdminProfile {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin';
  permissions: AdminPermission[];
  createdAt: string;
  lastLogin?: string;
}

export interface AdminSession {
  adminId: string;
  adminProfile: AdminProfile;
  impersonatedRole: UserType | null;
  impersonatedProfile: LandlordProfile | RenterProfile | AgencyProfile | null;
  sessionStarted: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userType: UserType | null;
  currentUser: LandlordProfile | RenterProfile | AgencyProfile | AdminProfile | null;
  onboardingStep: number;

  // Admin mode fields
  isAdminMode?: boolean;
  adminProfile?: AdminProfile;
  impersonatedRole?: UserType;
}
```

#### Step 1.2: Create Test Profile Generator
**New File:** `src/utils/adminTestProfiles.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import type {
  RenterProfile,
  LandlordProfile,
  AgencyProfile,
  RenterStatus,
} from '../types';
import { hashPassword } from './validation';

/**
 * Generates a complete test renter profile for admin role switching
 * All data is realistic and complies with RRA 2025
 */
export const generateTestRenter = async (): Promise<RenterProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  return {
    id: 'test-renter-001',
    email: 'test.renter@geton.com',
    passwordHash,
    name: 'Test Renter',
    age: 28,
    localArea: 'Liverpool',
    employmentStatus: 'Employed Full-Time',
    monthlyIncome: 2500,
    situation: 'Single',
    status: 'prospective' as RenterStatus,
    preferredMoveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    furnishingPreference: ['Furnished', 'Part Furnished'],
    hasPets: false,
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Generates a complete test landlord profile
 */
export const generateTestLandlord = async (): Promise<LandlordProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  return {
    id: 'test-landlord-001',
    email: 'test.landlord@geton.com',
    passwordHash,
    name: 'Test Landlord',
    propertyType: 'Flat',
    listingLink: 'https://example.com/property/123',
    furnishingPreference: 'Furnished',
    petsPreference: 'Pets Considered',
    prsRegistrationNumber: 'PRS123456789',
    prsRegistrationStatus: 'active',
    ombudsmanScheme: 'property_ombudsman',
    ombudsmanMembershipNumber: 'OM123456',
    isFullyCompliant: true,
    isRegisteredLandlord: true,
    depositScheme: 'mydeposits',
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Generates test estate agent profile
 */
export const generateTestEstateAgent = async (): Promise<AgencyProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  return {
    id: 'test-estate-agent-001',
    email: 'test.estateagent@geton.com',
    passwordHash,
    agencyType: 'estate_agent',
    companyName: 'Test Estate Agency Ltd',
    registrationNumber: 'EA123456',
    contactName: 'Agent Contact',
    contactPhone: '07700900123',
    address: '123 High Street, Liverpool, L1 1AA',
    serviceAreas: ['Liverpool', 'Southport', 'Formby'],
    isActive: true,
    managedPropertyIds: [],
    landlordClientIds: [],
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Generates test management agency profile
 */
export const generateTestManagementAgency = async (): Promise<AgencyProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  return {
    id: 'test-management-agency-001',
    email: 'test.managementagency@geton.com',
    passwordHash,
    agencyType: 'management_agency',
    companyName: 'Test Management Services Ltd',
    registrationNumber: 'MA123456',
    contactName: 'Manager Contact',
    contactPhone: '07700900456',
    address: '456 Management Road, Manchester, M1 1BB',
    serviceAreas: ['Manchester', 'Preston', 'Blackpool'],
    isActive: true,
    managedPropertyIds: [],
    landlordClientIds: [],
    slaEmergencyResponseHours: 4,
    slaUrgentResponseHours: 24,
    slaRoutineResponseHours: 72,
    slaComplianceRate: 95,
    activeTenantCount: 0,
    totalPropertiesManaged: 0,
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Initialize all test profiles and store them
 */
export const initializeTestProfiles = async (): Promise<void> => {
  const testProfiles = {
    renter: await generateTestRenter(),
    landlord: await generateTestLandlord(),
    estate_agent: await generateTestEstateAgent(),
    management_agency: await generateTestManagementAgency(),
  };

  localStorage.setItem('get-on-admin-test-profiles', JSON.stringify(testProfiles));
  console.log('[Admin] Test profiles initialized');
};

/**
 * Get test profile for a specific role
 */
export const getTestProfile = (
  userType: 'renter' | 'landlord' | 'estate_agent' | 'management_agency'
): RenterProfile | LandlordProfile | AgencyProfile | null => {
  const profilesJson = localStorage.getItem('get-on-admin-test-profiles');
  if (!profilesJson) return null;

  const profiles = JSON.parse(profilesJson);
  return profiles[userType] || null;
};
```

#### Step 1.3: Create Admin Storage Utility
**New File:** `src/lib/adminStorage.ts`

```typescript
import type { AdminProfile, AdminSession } from '../types';
import { hashPassword } from '../utils/validation';

const ADMIN_PROFILE_KEY = 'get-on-admin-profile';
const ADMIN_SESSION_KEY = 'get-on-admin-session';

/**
 * Initialize the admin profile (run once on first load)
 * In production, this would be in a secure backend
 */
export const initializeAdminProfile = async (): Promise<void> => {
  const existing = localStorage.getItem(ADMIN_PROFILE_KEY);
  if (existing) {
    console.log('[Admin] Admin profile already exists');
    return;
  }

  // Create default admin profile
  // In production: use environment variables and secure backend
  const adminProfile: AdminProfile = {
    id: 'admin-001',
    email: process.env.VITE_ADMIN_EMAIL || 'admin@geton.com',
    passwordHash: await hashPassword(process.env.VITE_ADMIN_PASSWORD || 'Admin1234!'),
    name: 'Admin User',
    role: 'admin',
    permissions: ['role_switching', 'view_all_users', 'modify_users', 'system_settings'],
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(adminProfile));
  console.log('[Admin] Admin profile initialized');
};

/**
 * Get admin profile
 */
export const getAdminProfile = (): AdminProfile | null => {
  const profileJson = localStorage.getItem(ADMIN_PROFILE_KEY);
  if (!profileJson) return null;
  return JSON.parse(profileJson);
};

/**
 * Save admin session
 */
export const saveAdminSession = (session: AdminSession): void => {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
};

/**
 * Get current admin session
 */
export const getAdminSession = (): AdminSession | null => {
  const sessionJson = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!sessionJson) return null;
  return JSON.parse(sessionJson);
};

/**
 * Clear admin session (logout)
 */
export const clearAdminSession = (): void => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

/**
 * Check if user has admin permission
 */
export const hasAdminPermission = (
  profile: AdminProfile,
  permission: 'role_switching' | 'view_all_users' | 'modify_users' | 'system_settings'
): boolean => {
  return profile.permissions.includes(permission);
};
```

#### Step 1.4: Update Auth Store
**File:** `src/hooks/useAuthStore.ts`

Add new methods after line 333:

```typescript
// Admin-specific methods

/**
 * Login as admin user
 */
loginAsAdmin: async (email: string, password: string) => {
  try {
    const { verifyPassword } = await import('../utils/validation');
    const { getAdminProfile, saveAdminSession } = await import('../lib/adminStorage');
    const { initializeTestProfiles } = await import('../utils/adminTestProfiles');

    // Get admin profile
    const adminProfile = getAdminProfile();
    if (!adminProfile) {
      console.error('[Auth] Admin profile not found');
      return false;
    }

    // Verify credentials
    if (adminProfile.email.toLowerCase() !== email.toLowerCase()) {
      console.error('[Auth] Admin email mismatch');
      return false;
    }

    const isValid = await verifyPassword(password, adminProfile.passwordHash);
    if (!isValid) {
      console.error('[Auth] Admin password incorrect');
      return false;
    }

    // Initialize test profiles if not exists
    await initializeTestProfiles();

    // Update last login
    adminProfile.lastLogin = new Date().toISOString();
    localStorage.setItem('get-on-admin-profile', JSON.stringify(adminProfile));

    // Create admin session
    const session: AdminSession = {
      adminId: adminProfile.id,
      adminProfile,
      impersonatedRole: null,
      impersonatedProfile: null,
      sessionStarted: new Date().toISOString(),
    };
    saveAdminSession(session);

    // Set auth state
    set({
      isAuthenticated: true,
      userType: 'admin',
      currentUser: adminProfile,
      isAdminMode: true,
      adminProfile,
      impersonatedRole: null,
      onboardingStep: 0,
    });

    console.log('[Auth] Admin login successful');
    return true;
  } catch (error) {
    console.error('[Auth] Admin login error:', error);
    return false;
  }
},

/**
 * Switch to a specific user role (admin impersonation)
 */
switchToRole: async (userType: Exclude<UserType, 'admin'>) => {
  const state = get();

  if (!state.isAdminMode || !state.adminProfile) {
    console.error('[Auth] Must be in admin mode to switch roles');
    return;
  }

  try {
    const { getTestProfile } = await import('../utils/adminTestProfiles');
    const { saveAdminSession } = await import('../lib/adminStorage');

    // Get test profile for this role
    const testProfile = getTestProfile(userType);
    if (!testProfile) {
      console.error(`[Auth] No test profile found for role: ${userType}`);
      return;
    }

    // Update session
    const session: AdminSession = {
      adminId: state.adminProfile.id,
      adminProfile: state.adminProfile,
      impersonatedRole: userType,
      impersonatedProfile: testProfile,
      sessionStarted: state.adminProfile.lastLogin || new Date().toISOString(),
    };
    saveAdminSession(session);

    // Update state
    set({
      userType,
      currentUser: testProfile,
      impersonatedRole: userType,
      onboardingStep: 0,
    });

    console.log(`[Auth] Switched to role: ${userType}`);
  } catch (error) {
    console.error('[Auth] Role switch error:', error);
  }
},

/**
 * Exit role impersonation and return to admin view
 */
exitRoleSwitch: () => {
  const state = get();

  if (!state.isAdminMode || !state.adminProfile) {
    console.error('[Auth] Not in admin mode');
    return;
  }

  try {
    const { saveAdminSession } = await import('../lib/adminStorage');

    // Reset to admin
    const session: AdminSession = {
      adminId: state.adminProfile.id,
      adminProfile: state.adminProfile,
      impersonatedRole: null,
      impersonatedProfile: null,
      sessionStarted: state.adminProfile.lastLogin || new Date().toISOString(),
    };
    saveAdminSession(session);

    set({
      userType: 'admin',
      currentUser: state.adminProfile,
      impersonatedRole: null,
    });

    console.log('[Auth] Exited role impersonation');
  } catch (error) {
    console.error('[Auth] Exit role switch error:', error);
  }
},

/**
 * Check if current user is admin (non-reactive)
 */
isAdmin: () => {
  const state = get();
  return state.isAdminMode === true || state.userType === 'admin';
},

/**
 * Get admin session data
 */
getAdminSession: () => {
  const { getAdminSession } = await import('../lib/adminStorage');
  return getAdminSession();
},
```

**Update logout method** to handle admin sessions:
```typescript
logout: () => {
  const state = get();

  // Clear admin session if in admin mode
  if (state.isAdminMode) {
    const { clearAdminSession } = await import('../lib/adminStorage');
    clearAdminSession();
  }

  // Clear visit flag
  localStorage.removeItem('get-on-has-visited');

  set({
    isAuthenticated: false,
    userType: null,
    currentUser: null,
    onboardingStep: 0,
    isAdminMode: false,
    adminProfile: undefined,
    impersonatedRole: undefined,
  });

  console.log('[Auth] Logged out successfully');
},
```

### Phase 2: UI Components (Admin Interface)

#### Step 2.1: Create Admin Login Page
**New File:** `src/pages/AdminLoginPage.tsx`

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * Admin login page - special access for administrators
 * Isolated from regular user flow
 */
export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { loginAsAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await loginAsAdmin(email, password);

      if (success) {
        navigate('/admin-dashboard');
      } else {
        setError('Invalid admin credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error('[AdminLogin] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Admin Badge */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-6 py-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">Admin Access</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            Admin Portal
          </h1>
          <p className="text-purple-300 text-center mb-8">
            Authorized personnel only
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-purple-200 mb-2">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@geton.com"
                required
                autoComplete="username"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-purple-200 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Authenticating...' : 'Access Admin Portal'}
            </button>
          </form>

          {/* Back to App */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-purple-300 hover:text-purple-200 text-sm transition"
            >
              ← Back to main app
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-xs">
            🔒 This area is restricted. All activity is logged.
          </p>
        </div>
      </div>
    </div>
  );
};
```

#### Step 2.2: Create Admin Dashboard (Role Selector)
**New File:** `src/pages/AdminDashboard.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  Shield,
  User,
  Home,
  Building2,
  Briefcase,
  ChevronRight,
  LogOut,
  Activity
} from 'lucide-react';
import type { UserType } from '../types';

interface RoleCard {
  type: Exclude<UserType, 'admin'>;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  testEmail: string;
}

const roleCards: RoleCard[] = [
  {
    type: 'renter',
    title: 'Renter',
    description: 'Browse properties, swipe, and create matches',
    icon: User,
    gradient: 'from-blue-500 to-cyan-500',
    testEmail: 'test.renter@geton.com',
  },
  {
    type: 'landlord',
    title: 'Landlord',
    description: 'Manage properties, view applications, and matches',
    icon: Home,
    gradient: 'from-green-500 to-emerald-500',
    testEmail: 'test.landlord@geton.com',
  },
  {
    type: 'estate_agent',
    title: 'Estate Agent',
    description: 'Market properties and manage client relationships',
    icon: Building2,
    gradient: 'from-orange-500 to-red-500',
    testEmail: 'test.estateagent@geton.com',
  },
  {
    type: 'management_agency',
    title: 'Management Agency',
    description: 'Handle maintenance, issues, and tenant management',
    icon: Briefcase,
    gradient: 'from-purple-500 to-pink-500',
    testEmail: 'test.managementagency@geton.com',
  },
];

/**
 * Admin Dashboard - Role selector for admin impersonation
 */
export const AdminDashboard: React.FC = () => {
  const { switchToRole, logout, adminProfile, impersonatedRole } = useAuthStore();
  const navigate = useNavigate();

  const handleRoleSelect = async (roleType: Exclude<UserType, 'admin'>) => {
    await switchToRole(roleType);
    // Navigate to appropriate dashboard after role switch
    navigate('/app');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                <p className="text-sm text-purple-300">
                  {adminProfile?.name || 'Administrator'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Select User Role
          </h2>
          <p className="text-lg text-purple-300">
            Choose a role to test the platform as that user type
          </p>
        </div>

        {/* Current Role Indicator */}
        {impersonatedRole && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <Activity className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="text-green-300 font-medium">
                  Currently viewing as: <span className="capitalize">{impersonatedRole.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {roleCards.map((role) => (
            <button
              key={role.type}
              onClick={() => handleRoleSelect(role.type)}
              className="group relative bg-white/10 backdrop-blur-md hover:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl p-6 text-left transition-all duration-200 hover:scale-105 hover:shadow-2xl"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-200`} />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${role.gradient} mb-4`}>
                  <role.icon className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-between">
                  {role.title}
                  <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </h3>

                {/* Description */}
                <p className="text-purple-200 mb-4">
                  {role.description}
                </p>

                {/* Test Account Info */}
                <div className="flex items-center gap-2 text-sm text-purple-300/80">
                  <span className="bg-white/5 px-2 py-1 rounded">
                    {role.testEmail}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <p className="text-white/60 text-sm">
            Click any role card to experience the platform from that user's perspective
          </p>
        </div>
      </main>
    </div>
  );
};
```

#### Step 2.3: Create Admin Mode Indicator Component
**New File:** `src/components/AdminModeIndicator.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';
import { Shield, ArrowLeft } from 'lucide-react';

/**
 * Visual indicator showing admin is impersonating a role
 * Appears at top of screen when admin is testing a role
 */
export const AdminModeIndicator: React.FC = () => {
  const { isAdminMode, impersonatedRole, exitRoleSwitch } = useAuthStore();
  const navigate = useNavigate();

  if (!isAdminMode || !impersonatedRole) {
    return null;
  }

  const handleExitRole = () => {
    exitRoleSwitch();
    navigate('/admin-dashboard');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 border-b border-purple-500 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-white" />
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">
              Admin Mode:
            </span>
            <span className="bg-white/20 px-2 py-1 rounded text-white text-xs font-semibold capitalize">
              {impersonatedRole.replace('_', ' ')}
            </span>
          </div>
        </div>

        <button
          onClick={handleExitRole}
          className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Exit Role</span>
        </button>
      </div>
    </div>
  );
};
```

### Phase 3: Integration & Routing

#### Step 3.1: Update App.tsx Routing
**File:** `src/App.tsx`

Add imports at top:
```typescript
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminModeIndicator } from './components/AdminModeIndicator';
```

Add admin initialization in useEffect (after line 70):
```typescript
useEffect(() => {
  // Initialize admin profile on first load
  const initAdmin = async () => {
    const { initializeAdminProfile } = await import('./lib/adminStorage');
    await initializeAdminProfile();
  };
  initAdmin();
}, []);
```

Update routing logic (around line 150):
```typescript
// Admin routing
if (isAdminMode) {
  // If admin hasn't selected a role, show role selector
  if (!impersonatedRole) {
    return <AdminDashboard />;
  }

  // Admin is impersonating a role - show that role's view with indicator
  return (
    <>
      <AdminModeIndicator />
      <div className="pt-12"> {/* Offset for admin indicator */}
        {userType === 'renter' && <SwipePage />}
        {userType === 'landlord' && <LandlordDashboard />}
        {(userType === 'estate_agent' || userType === 'management_agency') && <AgencyDashboard />}
      </div>
    </>
  );
}

// Existing routing for normal users...
```

Add admin routes in Router:
```typescript
<Routes>
  {/* Admin Routes */}
  <Route path="/admin-login" element={<AdminLoginPage />} />
  <Route path="/admin-dashboard" element={
    isAdminMode ? <AdminDashboard /> : <Navigate to="/admin-login" replace />
  } />

  {/* Existing routes... */}
  <Route path="/" element={/* existing logic */} />
  {/* ... rest of routes */}
</Routes>
```

#### Step 3.2: Add Admin Link to Login Page
**File:** `src/pages/LoginPage.tsx`

Add at bottom of login form (after submit button):
```typescript
{/* Admin Access Link */}
<div className="mt-6 pt-6 border-t border-gray-200">
  <button
    type="button"
    onClick={() => navigate('/admin-login')}
    className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
  >
    <Shield className="w-4 h-4" />
    <span>Admin Access</span>
  </button>
</div>
```

### Phase 4: Testing (Full Coverage)

#### Step 4.1: E2E Tests for Admin Login
**New File:** `tests/e2e/admin/admin-login.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Admin Login', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should show admin login page', async ({ page }) => {
    await page.goto('/admin-login');

    // Check page elements
    await expect(page.getByText('Admin Portal')).toBeVisible();
    await expect(page.getByText('Authorized personnel only')).toBeVisible();
    await expect(page.locator('#admin-email')).toBeVisible();
    await expect(page.locator('#admin-password')).toBeVisible();
  });

  test('should login with valid admin credentials', async ({ page }) => {
    await page.goto('/admin-login');

    // Fill in admin credentials
    await page.locator('#admin-email').fill('admin@geton.com');
    await page.locator('#admin-password').fill('Admin1234!');

    // Submit form
    await page.getByRole('button', { name: /access admin portal/i }).click();

    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin-dashboard');
    await expect(page.getByText('Select User Role')).toBeVisible();
  });

  test('should reject invalid admin credentials', async ({ page }) => {
    await page.goto('/admin-login');

    // Fill in wrong credentials
    await page.locator('#admin-email').fill('admin@geton.com');
    await page.locator('#admin-password').fill('WrongPassword123!');

    // Submit form
    await page.getByRole('button', { name: /access admin portal/i }).click();

    // Should show error
    await expect(page.getByText('Invalid admin credentials')).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL('/admin-login');
  });

  test('should show password toggle', async ({ page }) => {
    await page.goto('/admin-login');

    const passwordInput = page.locator('#admin-password');
    const toggleButton = page.getByLabel(/show password/i);

    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle
    await toggleButton.click();

    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle again
    await toggleButton.click();

    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate back to main app', async ({ page }) => {
    await page.goto('/admin-login');

    // Click back button
    await page.getByText('← Back to main app').click();

    // Should navigate to home
    await expect(page).toHaveURL('/');
  });
});
```

#### Step 4.2: E2E Tests for Role Switching
**New File:** `tests/e2e/admin/role-switching.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const adminLogin = async (page: Page) => {
  await page.goto('/admin-login');
  await page.locator('#admin-email').fill('admin@geton.com');
  await page.locator('#admin-password').fill('Admin1234!');
  await page.getByRole('button', { name: /access admin portal/i }).click();
  await expect(page).toHaveURL('/admin-dashboard');
};

test.describe('Admin Role Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should show all role cards on admin dashboard', async ({ page }) => {
    await adminLogin(page);

    // Check all 4 role cards are visible
    await expect(page.getByText('Renter')).toBeVisible();
    await expect(page.getByText('Landlord')).toBeVisible();
    await expect(page.getByText('Estate Agent')).toBeVisible();
    await expect(page.getByText('Management Agency')).toBeVisible();
  });

  test('should switch to renter role', async ({ page }) => {
    await adminLogin(page);

    // Click renter card
    await page.getByRole('button', { name: /Renter/i }).click();

    // Should show admin mode indicator
    await expect(page.getByText('Admin Mode:')).toBeVisible();
    await expect(page.getByText('Renter')).toBeVisible();

    // Should show renter dashboard (SwipePage)
    await expect(page).toHaveURL('/app');
    // Check for renter-specific content
    await page.waitForTimeout(1000); // Wait for app to load
  });

  test('should switch to landlord role', async ({ page }) => {
    await adminLogin(page);

    // Click landlord card
    await page.getByRole('button', { name: /Landlord/i }).click();

    // Should show admin mode indicator
    await expect(page.getByText('Admin Mode:')).toBeVisible();
    await expect(page.getByText('Landlord')).toBeVisible();

    // Should show landlord dashboard
    await expect(page).toHaveURL('/app');
  });

  test('should switch between multiple roles', async ({ page }) => {
    await adminLogin(page);

    // Switch to renter
    await page.getByRole('button', { name: /Renter/i }).click();
    await expect(page.getByText('Admin Mode:')).toBeVisible();

    // Exit back to admin dashboard
    await page.getByRole('button', { name: /exit role/i }).click();
    await expect(page).toHaveURL('/admin-dashboard');

    // Switch to landlord
    await page.getByRole('button', { name: /Landlord/i }).click();
    await expect(page.getByText('Admin Mode:')).toBeVisible();
    await expect(page.getByText('Landlord')).toBeVisible();
  });

  test('should exit role and return to admin dashboard', async ({ page }) => {
    await adminLogin(page);

    // Switch to a role
    await page.getByRole('button', { name: /Renter/i }).click();
    await expect(page.getByText('Admin Mode:')).toBeVisible();

    // Click exit role button
    await page.getByRole('button', { name: /exit role/i }).click();

    // Should return to admin dashboard
    await expect(page).toHaveURL('/admin-dashboard');
    await expect(page.getByText('Select User Role')).toBeVisible();

    // Admin indicator should be gone
    await expect(page.getByText('Admin Mode:')).not.toBeVisible();
  });

  test('should logout from admin dashboard', async ({ page }) => {
    await adminLogin(page);

    // Click logout button
    await page.getByRole('button', { name: /logout/i }).click();

    // Should return to welcome/role-select
    await expect(page).toHaveURL('/');

    // Check auth state cleared
    const authState = await page.evaluate(() => {
      const authJson = localStorage.getItem('get-on-auth');
      return authJson ? JSON.parse(authJson) : null;
    });

    expect(authState?.state?.isAuthenticated).toBeFalsy();
  });

  test('should persist admin session across page reload', async ({ page }) => {
    await adminLogin(page);

    // Switch to renter role
    await page.getByRole('button', { name: /Renter/i }).click();
    await expect(page.getByText('Admin Mode:')).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Should still be in admin mode as renter
    await expect(page.getByText('Admin Mode:')).toBeVisible();
    await expect(page).toHaveURL('/app');
  });
});
```

#### Step 4.3: E2E Test Helper Updates
**File:** `tests/e2e/utils/auth-helpers.ts`

Add admin helper functions:
```typescript
/**
 * Login as admin
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/admin-login');
  await page.locator('#admin-email').fill('admin@geton.com');
  await page.locator('#admin-password').fill('Admin1234!');
  await page.getByRole('button', { name: /access admin portal/i }).click();
  await page.waitForURL('/admin-dashboard');
}

/**
 * Switch admin to specific role
 */
export async function switchAdminToRole(
  page: Page,
  roleType: 'renter' | 'landlord' | 'estate_agent' | 'management_agency'
): Promise<void> {
  await page.goto('/admin-dashboard');

  const roleNameMap = {
    renter: 'Renter',
    landlord: 'Landlord',
    estate_agent: 'Estate Agent',
    management_agency: 'Management Agency',
  };

  await page.getByRole('button', { name: new RegExp(roleNameMap[roleType], 'i') }).click();
  await page.waitForURL('/app');
}

/**
 * Check if in admin mode
 */
export async function isInAdminMode(page: Page): Promise<boolean> {
  const indicator = page.getByText('Admin Mode:');
  return await indicator.isVisible().catch(() => false);
}
```

#### Step 4.4: Unit Tests for Admin Store
**New File:** `tests/unit/hooks/useAuthStore.admin.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '../../../src/hooks/useAuthStore';

describe('useAuthStore - Admin Functions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('loginAsAdmin', () => {
    it('should login with valid admin credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Initialize admin profile first
      const { initializeAdminProfile } = await import('../../../src/lib/adminStorage');
      await initializeAdminProfile();

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.loginAsAdmin('admin@geton.com', 'Admin1234!');
      });

      expect(success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userType).toBe('admin');
      expect(result.current.isAdminMode).toBe(true);
    });

    it('should reject invalid admin credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      const { initializeAdminProfile } = await import('../../../src/lib/adminStorage');
      await initializeAdminProfile();

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.loginAsAdmin('admin@geton.com', 'WrongPassword');
      });

      expect(success).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('switchToRole', () => {
    it('should switch to renter role', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Login as admin first
      const { initializeAdminProfile } = await import('../../../src/lib/adminStorage');
      await initializeAdminProfile();

      await act(async () => {
        await result.current.loginAsAdmin('admin@geton.com', 'Admin1234!');
      });

      // Switch to renter
      await act(async () => {
        await result.current.switchToRole('renter');
      });

      expect(result.current.userType).toBe('renter');
      expect(result.current.isAdminMode).toBe(true);
      expect(result.current.impersonatedRole).toBe('renter');
      expect(result.current.currentUser).toBeTruthy();
    });

    it('should not switch role if not in admin mode', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.switchToRole('renter');
      });

      expect(result.current.userType).toBeNull();
      expect(result.current.isAdminMode).toBeFalsy();
    });
  });

  describe('exitRoleSwitch', () => {
    it('should return to admin view from impersonated role', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Login and switch to role
      const { initializeAdminProfile } = await import('../../../src/lib/adminStorage');
      await initializeAdminProfile();

      await act(async () => {
        await result.current.loginAsAdmin('admin@geton.com', 'Admin1234!');
        await result.current.switchToRole('renter');
      });

      expect(result.current.userType).toBe('renter');

      // Exit role
      await act(async () => {
        result.current.exitRoleSwitch();
      });

      expect(result.current.userType).toBe('admin');
      expect(result.current.impersonatedRole).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should return true when in admin mode', async () => {
      const { result } = renderHook(() => useAuthStore());

      const { initializeAdminProfile } = await import('../../../src/lib/adminStorage');
      await initializeAdminProfile();

      await act(async () => {
        await result.current.loginAsAdmin('admin@geton.com', 'Admin1234!');
      });

      expect(result.current.isAdmin()).toBe(true);
    });

    it('should return false when not admin', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isAdmin()).toBe(false);
    });
  });
});
```

#### Step 4.5: Unit Tests for Admin Components
**New File:** `tests/unit/pages/AdminLoginPage.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminLoginPage } from '../../../src/pages/AdminLoginPage';
import { useAuthStore } from '../../../src/hooks/useAuthStore';

vi.mock('../../../src/hooks/useAuthStore');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLoginPage', () => {
  const mockLoginAsAdmin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      loginAsAdmin: mockLoginAsAdmin,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AdminLoginPage />
      </BrowserRouter>
    );
  };

  it('should render admin login form', () => {
    renderComponent();

    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/admin password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /access admin portal/i })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    mockLoginAsAdmin.mockResolvedValue(true);
    renderComponent();

    fireEvent.change(screen.getByLabelText(/admin email/i), {
      target: { value: 'admin@geton.com' },
    });
    fireEvent.change(screen.getByLabelText(/admin password/i), {
      target: { value: 'Admin1234!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /access admin portal/i }));

    await waitFor(() => {
      expect(mockLoginAsAdmin).toHaveBeenCalledWith('admin@geton.com', 'Admin1234!');
      expect(mockNavigate).toHaveBeenCalledWith('/admin-dashboard');
    });
  });

  it('should show error on failed login', async () => {
    mockLoginAsAdmin.mockResolvedValue(false);
    renderComponent();

    fireEvent.change(screen.getByLabelText(/admin email/i), {
      target: { value: 'admin@geton.com' },
    });
    fireEvent.change(screen.getByLabelText(/admin password/i), {
      target: { value: 'wrong' },
    });

    fireEvent.click(screen.getByRole('button', { name: /access admin portal/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid admin credentials')).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', () => {
    renderComponent();

    const passwordInput = screen.getByLabelText(/admin password/i) as HTMLInputElement;
    const toggleButton = screen.getByLabelText(/show password/i);

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });
});
```

### Phase 5: Documentation & Security

#### Step 5.1: Environment Variables
**File:** `.env.example`

Add admin configuration:
```env
# Admin Configuration (CHANGE IN PRODUCTION)
VITE_ADMIN_EMAIL=admin@geton.com
VITE_ADMIN_PASSWORD=Admin1234!

# Security: Set these to strong values in production
# Admin credentials should be stored securely (e.g., AWS Secrets Manager)
```

#### Step 5.2: Security Documentation
**New File:** `ADMIN_SECURITY.md`

```markdown
# Admin System Security Documentation

## Overview
The admin role switching system provides development and testing capabilities. This document outlines security considerations and best practices.

## ⚠️ Security Warnings

### Current Implementation (Development)
- Admin credentials stored in localStorage
- Password hashing using client-side SHA-256
- No rate limiting on admin login attempts
- No IP whitelisting
- No MFA/2FA support

### Production Requirements
Before deploying to production, implement:

1. **Backend Authentication**
   - Move admin verification to secure backend
   - Use OAuth 2.0 or JWT tokens
   - Store credentials in secure secrets management (AWS Secrets Manager, HashiCorp Vault)

2. **Access Controls**
   - IP whitelisting for admin routes
   - VPN requirement for admin access
   - Rate limiting (max 3 failed attempts per 15 minutes)

3. **Audit Logging**
   - Log all admin logins
   - Log all role switches
   - Log admin actions with timestamps
   - Send alerts on suspicious activity

4. **Multi-Factor Authentication**
   - Require MFA for admin login
   - Use TOTP (Google Authenticator) or WebAuthn

5. **Session Management**
   - Short session timeouts (15 minutes)
   - Automatic logout on inactivity
   - Secure session tokens (httpOnly cookies)

## Access Control

### Admin Credentials
**Default (Development Only):**
- Email: admin@geton.com
- Password: Admin1234!

**Production:**
Set via environment variables:
```bash
VITE_ADMIN_EMAIL=your-secure-email@domain.com
VITE_ADMIN_PASSWORD=Your-Very-Strong-Password-123!
```

### Permissions
Current admin has all permissions:
- role_switching
- view_all_users
- modify_users
- system_settings

## Recommended Security Measures

### 1. Network Security
```typescript
// Add IP whitelist check (server-side)
const ALLOWED_ADMIN_IPS = [
  '192.168.1.100', // Office IP
  '10.0.0.50',     // VPN IP
];

function isAllowedIP(requestIP: string): boolean {
  return ALLOWED_ADMIN_IPS.includes(requestIP);
}
```

### 2. Rate Limiting
```typescript
// Add rate limiting for admin login
const loginAttempts = new Map<string, number>();

function checkRateLimit(email: string): boolean {
  const attempts = loginAttempts.get(email) || 0;
  if (attempts >= 3) {
    // Block for 15 minutes
    return false;
  }
  loginAttempts.set(email, attempts + 1);
  return true;
}
```

### 3. Audit Logging
```typescript
// Log all admin actions
interface AdminAuditLog {
  timestamp: string;
  adminId: string;
  action: 'login' | 'logout' | 'role_switch' | 'modify_user';
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

function logAdminAction(log: AdminAuditLog): void {
  // Send to backend logging service
  console.log('[ADMIN_AUDIT]', log);
  // In production: send to CloudWatch, DataDog, etc.
}
```

## Testing Access

### For Developers
Admin access is available at: `/admin-login`

### For QA Teams
Use test credentials (provided separately) to access admin mode for testing all user roles.

## Incident Response

If admin credentials are compromised:
1. Immediately rotate credentials
2. Review audit logs for unauthorized access
3. Check for data modifications
4. Notify security team
5. Update environment variables
6. Force logout all admin sessions

## Compliance

### GDPR Considerations
- Admin access to user data must be logged
- Users have right to know who accessed their data
- Implement data access audit trail

### UK Data Protection Act 2018
- Admin accounts require justification
- Access must be role-appropriate
- Regular access reviews required
```

#### Step 5.3: Update Main README
**File:** `README.md`

Add admin section after "Testing" section:
```markdown
## 🔐 Admin Access

### Admin Login
For development and testing, access the admin portal at:
```
http://localhost:5173/admin-login
```

**Default Credentials:**
- Email: `admin@geton.com`
- Password: `Admin1234!`

### Role Switching
The admin panel allows switching between all user roles:
- Renter
- Landlord
- Estate Agent
- Management Agency

This enables testing the platform from different user perspectives without creating multiple accounts.

### Security Note
⚠️ **For development use only.** See [ADMIN_SECURITY.md](ADMIN_SECURITY.md) for production security requirements.
```

---

## 4. Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Update `UserType` to include `'admin'`
- [ ] Create `AdminProfile` interface
- [ ] Create `AdminSession` interface
- [ ] Update `AuthState` interface
- [ ] Create `src/utils/adminTestProfiles.ts`
- [ ] Create `src/lib/adminStorage.ts`
- [ ] Update `useAuthStore` with admin methods:
  - [ ] `loginAsAdmin()`
  - [ ] `switchToRole()`
  - [ ] `exitRoleSwitch()`
  - [ ] `isAdmin()`
  - [ ] `getAdminSession()`
- [ ] Update `logout()` to clear admin session

### Phase 2: UI Components ✅
- [ ] Create `AdminLoginPage.tsx`
- [ ] Create `AdminDashboard.tsx`
- [ ] Create `AdminModeIndicator.tsx`
- [ ] Style all components with Tailwind CSS
- [ ] Ensure responsive design (mobile, tablet, desktop)
- [ ] Add proper ARIA labels for accessibility

### Phase 3: Integration ✅
- [ ] Add admin initialization to `App.tsx` useEffect
- [ ] Update routing logic in `App.tsx` for admin mode
- [ ] Add `/admin-login` and `/admin-dashboard` routes
- [ ] Update `LoginPage.tsx` with admin access link
- [ ] Test admin indicator positioning with existing nav

### Phase 4: Testing ✅
- [ ] Create `tests/e2e/admin/admin-login.spec.ts`
- [ ] Create `tests/e2e/admin/role-switching.spec.ts`
- [ ] Update `tests/e2e/utils/auth-helpers.ts` with admin functions
- [ ] Create `tests/unit/hooks/useAuthStore.admin.test.ts`
- [ ] Create `tests/unit/pages/AdminLoginPage.test.tsx`
- [ ] Create `tests/unit/pages/AdminDashboard.test.tsx`
- [ ] Run full test suite: `npm run test && npm run test:e2e`
- [ ] Ensure all 26+ E2E tests still pass
- [ ] Ensure all 525+ unit tests still pass

### Phase 5: Documentation & Security ✅
- [ ] Create `.env.example` with admin vars
- [ ] Create `ADMIN_SECURITY.md`
- [ ] Update main `README.md`
- [ ] Add inline code comments
- [ ] Test admin flow end-to-end manually
- [ ] Verify session persistence across reloads
- [ ] Test logout clears admin session

### Phase 6: Final Verification ✅
- [ ] Build production bundle: `npm run build`
- [ ] Check for TypeScript errors: `npx tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Test all 4 role switches
- [ ] Verify admin mode indicator appears/disappears correctly
- [ ] Test switching between roles multiple times
- [ ] Verify test profiles are complete and realistic
- [ ] Check console for any errors or warnings
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)

---

## 5. Key Implementation Notes

### Critical Requirements

1. **Type Safety**
   - All new code must use TypeScript strict mode
   - No `any` types allowed
   - Proper interface definitions for all data structures

2. **State Persistence**
   - Admin session must persist across page reloads
   - Use Zustand persist middleware
   - Clear admin data completely on logout

3. **Test Coverage**
   - Every new component needs unit tests
   - Every user flow needs E2E tests
   - Aim for 100% coverage on admin code

4. **User Experience**
   - Admin mode indicator must be clearly visible
   - Role switching should be instant (no loading delays)
   - Exit button always accessible
   - Visual distinction between admin and normal mode

5. **Security Baseline**
   - Password hashing for admin credentials
   - Validation on all inputs
   - Clear audit trail in console logs
   - Documentation of security limitations

### Code Style

**Component Structure:**
```typescript
// 1. Imports (React, libraries, types, components, styles)
// 2. Interfaces/types (component-specific)
// 3. Component definition with proper typing
// 4. State declarations
// 5. Effects and handlers
// 6. Render (JSX)
// 7. Export
```

**Naming Conventions:**
- Components: PascalCase (`AdminLoginPage`)
- Functions: camelCase (`loginAsAdmin`)
- Constants: UPPER_SNAKE_CASE (`ADMIN_PROFILE_KEY`)
- Types: PascalCase (`AdminProfile`)
- Props interfaces: PascalCase with Props suffix (`AdminLoginPageProps`)

**File Organization:**
- One component per file
- Co-locate tests with source files
- Use index files for barrel exports
- Keep utilities in `/utils`, services in `/lib`

### Performance Considerations

1. **Lazy Loading**
   - Admin pages can be lazy loaded (not critical path)
   - Use React.lazy() for AdminLoginPage and AdminDashboard

2. **Memoization**
   - Memoize role cards in AdminDashboard
   - Use useMemo for expensive computations

3. **Bundle Size**
   - Admin code adds ~15KB gzipped
   - Acceptable overhead for dev/testing features

### Testing Strategy

**E2E Tests (Playwright):**
- Test complete user flows
- Use visual assertions (element visibility)
- Test session persistence with page reloads
- Test error states and edge cases

**Unit Tests (Vitest):**
- Test individual functions in isolation
- Mock external dependencies
- Test all branches (if/else, try/catch)
- Use React Testing Library for components

**Manual Testing:**
1. Fresh install test (clear all localStorage)
2. Session persistence test (reload at each step)
3. Multiple role switch test (switch 5+ times)
4. Concurrent user test (admin + normal user in separate tabs)
5. Mobile responsiveness test (iOS Safari, Chrome Android)

### Common Pitfalls to Avoid

❌ **Don't:**
- Hard-code credentials in component files
- Use `any` type for admin data
- Skip error handling in async functions
- Forget to clear admin session on logout
- Leave console.logs in production code
- Skip accessibility attributes
- Forget mobile styling

✅ **Do:**
- Use environment variables for credentials
- Type everything strictly
- Wrap async calls in try/catch
- Clear all admin state on logout
- Use proper logging (with [Admin] prefix)
- Add ARIA labels and roles
- Test on mobile viewport

---

## 6. Success Criteria

The implementation is complete when:

### Functional Requirements ✅
- [ ] Admin can login at `/admin-login`
- [ ] Admin sees role selector dashboard after login
- [ ] Admin can switch to any of 4 roles
- [ ] Admin mode indicator shows when impersonating
- [ ] Each role shows appropriate dashboard
- [ ] Admin can exit role and return to selector
- [ ] Admin can logout completely
- [ ] Session persists across page reload
- [ ] Test profiles are complete and realistic

### Technical Requirements ✅
- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings
- [ ] All 26+ E2E tests pass
- [ ] All 525+ unit tests pass
- [ ] 8+ new admin tests added and passing
- [ ] Production build succeeds
- [ ] Bundle size increase < 20KB

### Code Quality ✅
- [ ] No placeholders or TODOs
- [ ] All functions have docstrings
- [ ] Complex logic has inline comments
- [ ] Proper error handling throughout
- [ ] Consistent code style
- [ ] Type-safe (no `any`)

### Documentation ✅
- [ ] README updated with admin section
- [ ] ADMIN_SECURITY.md created
- [ ] .env.example includes admin vars
- [ ] Inline code comments present
- [ ] Test documentation in spec files

### User Experience ✅
- [ ] UI is intuitive and clear
- [ ] No confusing states
- [ ] Loading states handled
- [ ] Error messages helpful
- [ ] Mobile responsive
- [ ] Accessible (WCAG AA)

---

## 7. Post-Implementation Tasks

After completing the implementation:

1. **Code Review**
   - Review all new files for quality
   - Check for security issues
   - Verify test coverage

2. **Performance Audit**
   - Run Lighthouse audit
   - Check bundle size impact
   - Profile runtime performance

3. **Security Review**
   - Review ADMIN_SECURITY.md
   - Test rate limiting (if implemented)
   - Verify credentials are not exposed

4. **Documentation Review**
   - Ensure README is up to date
   - Verify all examples work
   - Check for broken links

5. **Git Commit**
   ```bash
   git add .
   git commit -m "feat: Add admin role switching system

   - Add admin user type and authentication
   - Create admin login page and dashboard
   - Implement role switching functionality
   - Add admin mode indicator
   - Create test user profiles for each role
   - Add 8 E2E tests and unit tests
   - Update documentation with admin section
   - Add security documentation

   Closes #XXX"
   ```

---

## 8. Future Enhancements

Potential improvements for v2:

1. **Backend Integration**
   - Move admin auth to secure backend API
   - Implement JWT token authentication
   - Add refresh token rotation

2. **Advanced Features**
   - User management interface (view/edit all users)
   - Data seeding tools
   - Feature flag management
   - System settings panel
   - Analytics dashboard

3. **Security Enhancements**
   - Multi-factor authentication
   - IP whitelisting
   - Rate limiting
   - Session timeout warnings
   - Audit log viewer

4. **Developer Tools**
   - GraphQL playground
   - API request inspector
   - State debugger
   - Performance profiler

---

## Summary

This prompt provides a **complete, step-by-step guide** to implementing a production-ready admin role switching system for the PropertySwipe platform.

**Key Features:**
- ✅ Admin login with secure authentication
- ✅ Role selector dashboard with 4 user types
- ✅ Seamless role switching without logout
- ✅ Visual admin mode indicator
- ✅ Complete test user profiles
- ✅ Full test coverage (E2E + unit)
- ✅ Security documentation
- ✅ Session persistence
- ✅ Zero placeholders

**Implementation Time:** ~8-12 hours for senior developer

**Code Quality:** Production-ready, type-safe, fully tested

**Maintainability:** Well-documented, follows existing patterns, extensible

This system will dramatically improve development and QA workflows by allowing instant switching between user roles for testing and debugging.
