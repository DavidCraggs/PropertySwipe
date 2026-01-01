# Implementation Plan Addendum
## Testing Strategy, Code Quality Standards & Missing Features

This addendum enhances the `WORLD_CLASS_IMPLEMENTATION_PLAN.md` with comprehensive testing requirements, code quality standards, and identifies any missing features to ensure the codebase is maintainable by humans and AI agents.

---

## Part 1: Comprehensive Testing Strategy

### 1.1 Testing Philosophy

Every new feature must include:
1. **Unit Tests** - Individual function/component testing
2. **Integration Tests** - Feature flow testing
3. **E2E Tests** - User journey testing
4. **Accessibility Tests** - WCAG 2.1 AA compliance

**Coverage Targets:**
| Category | Target | Minimum |
|----------|--------|---------|
| Unit Test Coverage | 90% | 80% |
| Integration Test Coverage | 80% | 70% |
| E2E Critical Paths | 100% | 100% |
| Accessibility | 100% automated | 95% |

### 1.2 Unit Testing Standards

#### File Naming Convention
```
src/
├── services/
│   └── DataDeletionService.ts
tests/
├── unit/
│   └── services/
│       └── DataDeletionService.test.ts
```

#### Test Structure Template
```typescript
// File: tests/unit/services/DataDeletionService.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataDeletionService } from '@/services/DataDeletionService';
import { supabase } from '@/lib/supabase';

// Mock external dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(),
      select: vi.fn(),
      eq: vi.fn(),
    })),
  },
}));

describe('DataDeletionService', () => {
  // Setup and teardown
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Group related tests
  describe('requestDeletion', () => {
    it('should create a deletion request with verification token', async () => {
      // Arrange
      const userId = 'user-123';
      const userType = 'renter';

      // Act
      const result = await DataDeletionService.requestDeletion(userId, userType);

      // Assert
      expect(result.verificationToken).toBeDefined();
      expect(result.verificationToken.length).toBeGreaterThan(20);
      expect(result.status).toBe('pending_verification');
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent';

      // Act & Assert
      await expect(
        DataDeletionService.requestDeletion(userId, 'renter')
      ).rejects.toThrow('User not found');
    });

    it('should prevent duplicate deletion requests', async () => {
      // Arrange
      const userId = 'user-123';
      await DataDeletionService.requestDeletion(userId, 'renter');

      // Act & Assert
      await expect(
        DataDeletionService.requestDeletion(userId, 'renter')
      ).rejects.toThrow('Deletion request already exists');
    });
  });

  describe('executeDeletion', () => {
    it('should delete data from all related tables', async () => {
      // Implementation...
    });

    it('should respect 30-day grace period', async () => {
      // Implementation...
    });

    it('should anonymize data that cannot be deleted', async () => {
      // Implementation...
    });
  });

  describe('edge cases', () => {
    it('should handle network timeout gracefully', async () => {
      // Implementation...
    });

    it('should rollback partial deletion on error', async () => {
      // Implementation...
    });
  });
});
```

### 1.3 Integration Testing Standards

#### Test File Structure
```typescript
// File: tests/integration/gdpr-deletion-flow.test.tsx

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '@/App';
import { seedTestUser, cleanupTestData } from '@tests/utils/testHelpers';

describe('GDPR Deletion Flow', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    testUser = await seedTestUser({ type: 'renter' });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('should allow user to request data deletion from profile page', async () => {
    const user = userEvent.setup();

    // Render app with logged-in user
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <App initialUser={testUser} />
      </MemoryRouter>
    );

    // Navigate to data privacy section
    await user.click(screen.getByRole('button', { name: /data privacy/i }));

    // Request deletion
    await user.click(screen.getByRole('button', { name: /delete my data/i }));

    // Confirm deletion
    await user.click(screen.getByRole('button', { name: /confirm deletion/i }));

    // Verify confirmation message
    await waitFor(() => {
      expect(screen.getByText(/deletion request received/i)).toBeInTheDocument();
    });

    // Verify email was sent
    expect(mockEmailService.sendVerification).toHaveBeenCalledWith(
      testUser.email,
      expect.any(String) // verification token
    );
  });

  it('should complete deletion after email verification', async () => {
    // Request deletion
    const request = await DataDeletionService.requestDeletion(testUser.id, 'renter');

    // Simulate email verification
    await DataDeletionService.verifyDeletion(request.verificationToken);

    // Wait for grace period (mocked)
    vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000); // 30 days

    // Execute deletion
    await DataDeletionService.executePendingDeletions();

    // Verify data is deleted
    const userData = await getUserData(testUser.id);
    expect(userData).toBeNull();
  });
});
```

### 1.4 E2E Testing Standards (Playwright)

#### Critical User Journeys to Test

| Journey | Priority | File |
|---------|----------|------|
| Renter signup → swipe → match → message | CRITICAL | `tests/e2e/renter-journey.spec.ts` |
| Landlord signup → create property → view matches | CRITICAL | `tests/e2e/landlord-journey.spec.ts` |
| Agency signup → link landlord → manage issues | HIGH | `tests/e2e/agency-journey.spec.ts` |
| Two-sided matching flow | HIGH | `tests/e2e/mutual-matching.spec.ts` |
| GDPR data export and deletion | HIGH | `tests/e2e/gdpr-compliance.spec.ts` |
| ID verification flow | MEDIUM | `tests/e2e/id-verification.spec.ts` |
| Report generation | MEDIUM | `tests/e2e/reporting.spec.ts` |
| Payment and subscription | HIGH | `tests/e2e/payment-flow.spec.ts` |

#### E2E Test Template
```typescript
// File: tests/e2e/gdpr-compliance.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { createTestUser, deleteTestUser } from './utils/testData';

test.describe('GDPR Compliance', () => {
  let testUser: TestUser;

  test.beforeEach(async () => {
    testUser = await createTestUser({
      type: 'renter',
      withData: true, // Creates matches, messages, etc.
    });
  });

  test.afterEach(async () => {
    await deleteTestUser(testUser.id);
  });

  test('user can export all their data', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const profilePage = new ProfilePage(page);

    // Login
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    // Navigate to profile
    await profilePage.goto();
    await profilePage.openDataPrivacySettings();

    // Request data export
    await profilePage.requestDataExport('json');

    // Wait for export to complete
    await expect(page.getByText(/export ready/i)).toBeVisible({ timeout: 30000 });

    // Download and verify export
    const download = await profilePage.downloadExport();
    const content = JSON.parse(await download.text());

    expect(content.profile).toBeDefined();
    expect(content.matches).toBeDefined();
    expect(content.messages).toBeDefined();
    expect(content.ratings).toBeDefined();
  });

  test('user can request data deletion', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const profilePage = new ProfilePage(page);

    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await profilePage.goto();
    await profilePage.openDataPrivacySettings();
    await profilePage.requestDeletion();

    // Verify confirmation modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/30-day grace period/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify success message
    await expect(page.getByText(/deletion request received/i)).toBeVisible();

    // Verify user is logged out
    await expect(page).toHaveURL('/');
  });
});
```

### 1.5 Accessibility Testing

#### Automated Accessibility Tests
```typescript
// File: tests/accessibility/a11y.spec.ts

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pagesToTest = [
  { name: 'Home', url: '/' },
  { name: 'Login', url: '/login' },
  { name: 'Renter Onboarding', url: '/renter/onboarding' },
  { name: 'Landlord Onboarding', url: '/landlord/onboarding' },
  { name: 'Swipe Page', url: '/swipe', requiresAuth: true },
  { name: 'Matches Page', url: '/matches', requiresAuth: true },
  { name: 'Profile Page', url: '/profile', requiresAuth: true },
  { name: 'Agency Dashboard', url: '/agency/dashboard', requiresAuth: true },
];

for (const pageConfig of pagesToTest) {
  test(`${pageConfig.name} should have no accessibility violations`, async ({ page }) => {
    if (pageConfig.requiresAuth) {
      await loginAsTestUser(page);
    }

    await page.goto(pageConfig.url);
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
}
```

### 1.6 Test Data Management

#### Test Data Factories
```typescript
// File: tests/factories/userFactory.ts

import { faker } from '@faker-js/faker';
import type { RenterProfile, LandlordProfile, AgencyProfile } from '@/types';

export function createMockRenterProfile(
  overrides: Partial<RenterProfile> = {}
): RenterProfile {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    passwordHash: faker.string.alphanumeric(64),
    situation: faker.helpers.arrayElement(['Single', 'Couple', 'Family']),
    names: faker.person.fullName(),
    ages: faker.number.int({ min: 18, max: 65 }).toString(),
    localArea: faker.helpers.arrayElement(['Liverpool', 'Manchester', 'Southport']),
    renterType: faker.helpers.arrayElement(['Young Professional', 'Family', 'Student']),
    employmentStatus: faker.helpers.arrayElement(['Employed Full-Time', 'Self-Employed']),
    monthlyIncome: faker.number.int({ min: 1500, max: 6000 }),
    hasPets: faker.datatype.boolean(),
    smokingStatus: 'Non-Smoker',
    hasGuarantor: faker.datatype.boolean(),
    currentRentalSituation: 'Currently Renting',
    hasRentalHistory: true,
    previousLandlordReference: true,
    receivesHousingBenefit: false,
    receivesUniversalCredit: false,
    createdAt: new Date(),
    onboardingComplete: true,
    status: 'prospective',
    ...overrides,
  };
}

export function createMockProperty(
  landlordId: string,
  overrides: Partial<Property> = {}
): Property {
  return {
    id: faker.string.uuid(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.helpers.arrayElement(['Liverpool', 'Manchester', 'Southport']),
      postcode: faker.location.zipCode('L## #??'),
      council: 'Liverpool City Council',
    },
    rentPcm: faker.number.int({ min: 600, max: 2000 }),
    deposit: faker.number.int({ min: 600, max: 2500 }),
    maxRentInAdvance: 1,
    bedrooms: faker.number.int({ min: 1, max: 5 }),
    bathrooms: faker.number.int({ min: 1, max: 3 }),
    propertyType: faker.helpers.arrayElement(['Flat', 'Terraced', 'Semi-detached']),
    images: [faker.image.url()],
    description: faker.lorem.paragraphs(2),
    epcRating: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
    yearBuilt: faker.number.int({ min: 1900, max: 2024 }),
    features: ['Central Heating', 'Double Glazing'],
    furnishing: 'Furnished',
    availableFrom: faker.date.future().toISOString(),
    tenancyType: 'Periodic',
    maxOccupants: faker.number.int({ min: 2, max: 6 }),
    petsPolicy: {
      willConsiderPets: true,
      preferredPetTypes: ['cat', 'small_caged'],
      requiresPetInsurance: true,
      maxPetsAllowed: 2,
    },
    bills: {
      councilTaxBand: 'C',
      gasElectricIncluded: false,
      waterIncluded: false,
      internetIncluded: false,
    },
    meetsDecentHomesStandard: true,
    awaabsLawCompliant: true,
    prsPropertyRegistrationStatus: 'active',
    landlordId,
    isAvailable: true,
    canBeMarketed: true,
    listingDate: new Date().toISOString(),
    acceptsShortTermTenants: true,
    ...overrides,
  };
}
```

---

## Part 2: Code Quality Standards

### 2.1 TypeScript Strict Mode

All new code must compile with strict TypeScript settings:

```json
// tsconfig.json additions
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### 2.2 ESLint Configuration Enhancement

```javascript
// eslint.config.js - Enhanced
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Enforce no any
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Enforce proper error handling
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/promise-function-async': 'error',

      // Code style
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
      ],

      // Prevent common bugs
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
      'no-return-await': 'error',
      'require-await': 'error',

      // React specific
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // Relaxed rules for test files
  {
    files: ['tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'no-console': 'off',
    },
  },
]);
```

### 2.3 Error Handling Patterns

#### Service Layer Error Handling
```typescript
// File: src/lib/errors.ts

// Base error class for all application errors
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      },
    };
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404, true, { resource, id });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError: Error) {
    super(
      `External service ${service} failed: ${originalError.message}`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      true,
      { service, originalError: originalError.message }
    );
  }
}

// Error codes enum
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

// Error response interface
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    stack?: string;
  };
}
```

#### Async Error Handling Utility
```typescript
// File: src/lib/asyncHandler.ts

import { AppError } from './errors';
import { toast } from '@/components/organisms/Toast';

// Wrap async functions with error handling
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    showToast?: boolean;
    rethrow?: boolean;
    fallback?: R;
    onError?: (error: Error) => void;
  } = {}
): (...args: T) => Promise<R | undefined> {
  const { showToast = true, rethrow = false, fallback, onError } = options;

  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : 'Unknown error',
            'UNKNOWN_ERROR'
          );

      // Log error
      console.error(`[${appError.code}] ${appError.message}`, appError.context);

      // Show toast notification
      if (showToast) {
        toast.error(getUserFriendlyMessage(appError));
      }

      // Call custom error handler
      if (onError) {
        onError(appError);
      }

      // Rethrow if requested
      if (rethrow) {
        throw appError;
      }

      // Return fallback value
      return fallback;
    }
  };
}

// Get user-friendly error messages
function getUserFriendlyMessage(error: AppError): string {
  const messages: Record<ErrorCode, string> = {
    VALIDATION_ERROR: 'Please check your input and try again.',
    NOT_FOUND: 'The requested resource was not found.',
    UNAUTHORIZED: 'Please log in to continue.',
    FORBIDDEN: "You don't have permission to do that.",
    CONFLICT: 'This action conflicts with existing data.',
    EXTERNAL_SERVICE_ERROR: 'A service is temporarily unavailable. Please try again.',
    DATABASE_ERROR: 'Unable to save your data. Please try again.',
    UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  };

  return messages[error.code] ?? messages.UNKNOWN_ERROR;
}
```

#### Component Error Handling
```typescript
// File: src/components/organisms/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '@/lib/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);

    // Report to monitoring service (e.g., Sentry)
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
      });
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-danger-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-danger-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-neutral-600 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Refresh Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-neutral-500">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-neutral-100 rounded text-xs overflow-auto">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2.4 Code Documentation Standards

#### JSDoc Requirements
```typescript
/**
 * Deletes all user data from the system.
 *
 * Implements GDPR Article 17 "Right to Erasure" requirements.
 * Data is soft-deleted immediately and permanently removed after 30 days.
 *
 * @param userId - The unique identifier of the user to delete
 * @param userType - The type of user (renter, landlord, agency)
 * @param options - Optional configuration for the deletion
 * @returns Promise resolving to the deletion result
 *
 * @throws {NotFoundError} If user does not exist
 * @throws {ConflictError} If deletion request already pending
 * @throws {ValidationError} If userId or userType is invalid
 *
 * @example
 * ```typescript
 * const result = await deleteUserData('user-123', 'renter', {
 *   skipGracePeriod: false,
 *   notifyUser: true,
 * });
 * console.log(`Deleted ${result.recordsDeleted} records`);
 * ```
 *
 * @see {@link https://gdpr-info.eu/art-17-gdpr/} GDPR Article 17
 * @since 1.0.0
 */
export async function deleteUserData(
  userId: string,
  userType: UserType,
  options?: DeletionOptions
): Promise<DeletionResult> {
  // Implementation...
}
```

### 2.5 Component Standards

#### React Component Template
```typescript
// File: src/components/organisms/DataPrivacySettings.tsx

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/molecules/Modal';
import { useToast } from '@/components/organisms/Toast';
import { useAuthStore } from '@/hooks/useAuthStore';
import { DataExportService } from '@/services/DataExportService';
import { DataDeletionService } from '@/services/DataDeletionService';
import { withErrorHandling } from '@/lib/asyncHandler';
import type { ExportFormat } from '@/types';

/**
 * Props for the DataPrivacySettings component
 */
interface DataPrivacySettingsProps {
  /** Called when user initiates data export */
  onExportStart?: () => void;
  /** Called when user confirms deletion */
  onDeletionConfirmed?: () => void;
}

/**
 * DataPrivacySettings Component
 *
 * Provides GDPR-compliant data privacy controls including:
 * - Data export in multiple formats (JSON, CSV, PDF)
 * - Account deletion with 30-day grace period
 * - Consent management
 *
 * @component
 * @example
 * ```tsx
 * <DataPrivacySettings
 *   onExportStart={() => console.log('Export started')}
 *   onDeletionConfirmed={() => navigate('/goodbye')}
 * />
 * ```
 */
export function DataPrivacySettings({
  onExportStart,
  onDeletionConfirmed,
}: DataPrivacySettingsProps): JSX.Element {
  // State
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  // Hooks
  const { currentUser, userType, logout } = useAuthStore();
  const toast = useToast();

  // Handlers
  const handleExport = useCallback(async (): Promise<void> => {
    if (!currentUser) return;

    setIsExporting(true);
    onExportStart?.();

    const exportData = withErrorHandling(
      async () => {
        const result = await DataExportService.export({
          userId: currentUser.id,
          userType,
          format: exportFormat,
          includeConversations: true,
          includeRatings: true,
          includeActivityLog: true,
        });

        // Trigger download
        window.open(result.downloadUrl, '_blank');
        toast.success('Your data export is ready!');
      },
      { showToast: true }
    );

    await exportData();
    setIsExporting(false);
  }, [currentUser, userType, exportFormat, onExportStart, toast]);

  const handleDeleteRequest = useCallback(async (): Promise<void> => {
    if (!currentUser) return;

    setIsDeleting(true);

    const requestDeletion = withErrorHandling(
      async () => {
        await DataDeletionService.requestDeletion(currentUser.id, userType);
        toast.success('Deletion request received. Check your email to confirm.');
        setShowDeleteModal(false);
        onDeletionConfirmed?.();
        logout();
      },
      { showToast: true }
    );

    await requestDeletion();
    setIsDeleting(false);
  }, [currentUser, userType, toast, onDeletionConfirmed, logout]);

  // Render
  return (
    <div className="space-y-6">
      {/* Data Export Section */}
      <section className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Download className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900">
              Download Your Data
            </h3>
            <p className="text-neutral-600 mt-1">
              Get a copy of all your personal data stored on PropertySwipe.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {(['json', 'csv', 'pdf'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => setExportFormat(format)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    exportFormat === format
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>

            <Button
              onClick={handleExport}
              loading={isExporting}
              className="mt-4"
            >
              Export My Data
            </Button>
          </div>
        </div>
      </section>

      {/* Delete Account Section */}
      <section className="bg-white rounded-xl border border-danger-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-danger-100 rounded-lg">
            <Trash2 className="w-6 h-6 text-danger-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-danger-900">
              Delete Your Account
            </h3>
            <p className="text-danger-700 mt-1">
              Permanently delete your account and all associated data.
              This action cannot be undone after the 30-day grace period.
            </p>

            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              className="mt-4"
            >
              Delete My Account
            </Button>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Your Account"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-warning-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-warning-600 flex-shrink-0" />
            <p className="text-sm text-warning-800">
              Your account and all data will be permanently deleted after a 30-day
              grace period. You can cancel this request during that time.
            </p>
          </div>

          <div className="text-sm text-neutral-600">
            <p className="font-medium mb-2">This will delete:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your profile and preferences</li>
              <li>All matches and conversations</li>
              <li>Ratings you've given and received</li>
              <li>Property listings (if landlord/agency)</li>
              <li>Issue tickets and messages</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteRequest}
              loading={isDeleting}
              className="flex-1"
            >
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

---

## Part 3: Missing Features Identified

After comprehensive review, the following features are missing from the original plan:

### 3.1 Security Features (Add to Phase 1)

| Feature | Priority | Notes |
|---------|----------|-------|
| Rate Limiting | CRITICAL | Prevent brute force, DDoS |
| Input Sanitization | CRITICAL | Prevent XSS, SQL injection |
| CSRF Protection | HIGH | Protect state-changing requests |
| Session Management | HIGH | Secure session handling |
| Security Headers | HIGH | CSP, HSTS, X-Frame-Options |
| Audit Logging | HIGH | Track security events |

### 3.2 Internationalization (Add to Phase 7)

| Feature | Priority | Notes |
|---------|----------|-------|
| i18n Setup | MEDIUM | Support Welsh language for Wales rollout |
| RTL Support | LOW | Future Middle East expansion |
| Currency Formatting | HIGH | Already UK-focused |
| Date/Time Localization | MEDIUM | UK date format enforcement |

### 3.3 Performance Monitoring (Add to Phase 6)

| Feature | Priority | Notes |
|---------|----------|-------|
| APM Integration | HIGH | Datadog, New Relic, or Sentry |
| Web Vitals Tracking | HIGH | Core Web Vitals monitoring |
| Error Tracking | CRITICAL | Sentry or similar |
| Uptime Monitoring | HIGH | Pingdom, UptimeRobot |
| Database Query Monitoring | MEDIUM | Slow query alerts |

### 3.4 DevOps & CI/CD (Add to Phase 1)

| Feature | Priority | Notes |
|---------|----------|-------|
| GitHub Actions CI | CRITICAL | Lint, test, build on PR |
| Automated Deployment | HIGH | Vercel preview + production |
| Database Migrations | HIGH | Automated Supabase migrations |
| Environment Management | HIGH | Staging, production separation |
| Secrets Management | CRITICAL | Environment variables security |

### 3.5 CI/CD Pipeline Configuration

```yaml
# File: .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:run
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:a11y

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  deploy-preview:
    runs-on: ubuntu-latest
    needs: [build, e2e-tests]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: [build, e2e-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Part 4: Pre-Commit Hooks

```json
// package.json additions
{
  "scripts": {
    "prepare": "husky install",
    "lint-staged": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint-staged
npm run typecheck
```

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run test:run
```

---

## Part 5: Definition of Done

A feature is only considered "done" when:

### Code Quality
- [ ] All TypeScript types are explicit (no `any`)
- [ ] ESLint passes with zero errors
- [ ] Prettier formatting applied
- [ ] No `console.log` statements (use proper logging)
- [ ] Error handling follows defined patterns
- [ ] JSDoc comments on all public functions

### Testing
- [ ] Unit tests written (80%+ coverage for new code)
- [ ] Integration tests for feature flows
- [ ] E2E tests for critical paths
- [ ] Accessibility tests pass
- [ ] All tests pass in CI

### Documentation
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Inline code comments for complex logic
- [ ] Migration guide if breaking changes

### Security
- [ ] Input validation implemented
- [ ] No hardcoded secrets
- [ ] OWASP top 10 considered
- [ ] Security review for sensitive features

### Review
- [ ] Code review completed by senior developer
- [ ] Design review for UI changes
- [ ] Security review for auth/data changes
- [ ] Product review for user-facing features

---

**Document Version:** 1.0
**Created:** December 2024
**Companion To:** WORLD_CLASS_IMPLEMENTATION_PLAN.md
