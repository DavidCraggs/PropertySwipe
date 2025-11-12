# PropertySwipe Testing Guide

Comprehensive guide for writing, running, and maintaining tests in PropertySwipe.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Testing Philosophy](#testing-philosophy)
3. [Test Structure](#test-structure)
4. [Writing Unit Tests](#writing-unit-tests)
5. [Writing Component Tests](#writing-component-tests)
6. [Writing Integration Tests](#writing-integration-tests)
7. [Mocking Strategies](#mocking-strategies)
8. [Best Practices](#best-practices)
9. [Common Patterns](#common-patterns)
10. [Debugging Tests](#debugging-tests)
11. [Coverage](#coverage)
12. [CI/CD Integration](#cicd-integration)

---

## 🎯 Overview

PropertySwipe uses **Vitest** as the test runner and **React Testing Library** for component testing. Our test suite focuses on:

- **Correctness**: Ensuring features work as expected
- **Reliability**: Preventing regressions
- **Confidence**: Enabling safe refactoring
- **Documentation**: Tests serve as living documentation
- **Compliance**: Legal requirements (RRA 2025)

### Current Test Statistics

```
Test Files: 6 passed (6)
Tests: 224 passed (224)
Duration: ~5.83s
```

**Breakdown by Category**:
- Password validation & security: 62 tests
- Authentication logic: 32 tests
- Password input component: 34 tests
- Login page component: 20 tests
- RRA 2025 compliance: 75 tests
- Setup verification: 1 test

---

## 🧠 Testing Philosophy

### Testing Pyramid

```
       /\
      /E2E\         ← Few, high-value scenarios
     /------\
    /Integration\   ← Key user flows
   /------------\
  /   Unit Tests \  ← Many, fast, focused
 /----------------\
```

**Our Focus**:
1. **Unit Tests (80%)**: Fast, isolated, comprehensive
2. **Integration Tests (15%)**: Key user flows
3. **E2E Tests (5%)**: Critical paths only

### What to Test

✅ **DO Test**:
- Business logic and calculations
- User interactions and UI state changes
- Edge cases and error handling
- Security validations
- Legal compliance (RRA 2025)
- Data transformations
- API integrations

❌ **DON'T Test**:
- Third-party libraries (assume they work)
- Implementation details (internal state, private methods)
- Trivial code (getters, setters)
- CSS styling (visual regression tools instead)

### Test Quality Principles

1. **Readable**: Tests should be self-documenting
2. **Maintainable**: Easy to update when requirements change
3. **Fast**: Run quickly to enable rapid feedback
4. **Isolated**: No dependencies between tests
5. **Deterministic**: Same input = same output (no flakiness)

---

## 📂 Test Structure

### Directory Organization

```
tests/
├── __mocks__/                    # Mock implementations
│   ├── supabase.ts               # Supabase client mock
│   └── localStorage.ts           # Storage mocks
│
├── unit/                         # Unit tests
│   ├── components/               # Component tests
│   │   ├── PasswordInput.test.tsx
│   │   └── LoginPage.test.tsx
│   │
│   ├── hooks/                    # Hook tests
│   │   └── useAuthStore.test.ts
│   │
│   └── utils/                    # Utility function tests
│       ├── validation.test.ts
│       └── messageValidation.test.ts
│
├── integration/                  # Integration tests (planned)
│   └── onboarding-flow.test.tsx
│
├── e2e/                          # E2E tests (planned)
│   └── complete-signup.spec.ts
│
├── setup.ts                      # Global test setup
└── utils/                        # Test utilities
    └── testHelpers.ts            # Shared test helpers
```

### Naming Conventions

**Test Files**:
- Unit tests: `*.test.ts` or `*.test.tsx`
- Component tests: `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.spec.ts` (Playwright convention)

**Test Suites**:
```typescript
describe('ComponentName', () => {
  describe('FeatureName', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

**Test Names**:
- ✅ `'should validate password with uppercase requirement'`
- ✅ `'should display error when email is invalid'`
- ✅ `'should call onSubmit when form is valid'`
- ❌ `'test password'`
- ❌ `'it works'`
- ❌ `'edge case'`

---

## 🔬 Writing Unit Tests

### Basic Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('UtilityFunction', () => {
  // Setup before each test
  beforeEach(() => {
    // Initialize mocks, reset state
  });

  // Cleanup after each test
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle valid input', () => {
    const result = utilityFunction('valid input');
    expect(result).toBe('expected output');
  });

  it('should handle invalid input', () => {
    const result = utilityFunction('invalid input');
    expect(result.error).toBeDefined();
  });

  it('should handle edge cases', () => {
    expect(utilityFunction('')).toBe('default');
    expect(utilityFunction(null)).toBe('default');
  });
});
```

### Example: Password Validation Test

```typescript
// tests/unit/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validatePassword } from '@/utils/validation';

describe('Password Validation', () => {
  describe('Length Requirement', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least 8 characters');
    });

    it('should accept passwords with exactly 8 characters', () => {
      const result = validatePassword('Pass123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept passwords longer than 8 characters', () => {
      const result = validatePassword('Password123!@#');

      expect(result.isValid).toBe(true);
    });
  });

  describe('Uppercase Requirement', () => {
    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('password123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('One uppercase letter');
    });

    it('should accept passwords with uppercase letters', () => {
      const result = validatePassword('Password123!');

      expect(result.isValid).toBe(true);
    });
  });

  // More test cases...
});
```

### Testing Async Functions

```typescript
import { describe, it, expect } from 'vitest';
import { fetchUserProfile } from '@/lib/storage';

describe('fetchUserProfile', () => {
  it('should fetch user profile successfully', async () => {
    const userId = 'test-user-id';

    const profile = await fetchUserProfile(userId);

    expect(profile).toBeDefined();
    expect(profile.id).toBe(userId);
  });

  it('should throw error when user not found', async () => {
    await expect(
      fetchUserProfile('nonexistent-id')
    ).rejects.toThrow('User not found');
  });
});
```

### Testing Error Handling

```typescript
describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    // Mock network failure
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await fetchData();

    expect(result.error).toBe('Failed to fetch data');
    expect(result.data).toBeNull();
  });

  it('should handle validation errors', () => {
    expect(() => {
      processInput('invalid');
    }).toThrow('Invalid input');
  });
});
```

---

## 🧩 Writing Component Tests

### Setup

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';
```

### Basic Component Test

```typescript
describe('MyComponent', () => {
  it('should render with default props', () => {
    render(<MyComponent title="Test" />);

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(<MyComponent isLoading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
describe('User Interactions', () => {
  it('should call onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(<Button onClick={mockOnClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should update input value on typing', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(<Input value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello');

    expect(mockOnChange).toHaveBeenCalledTimes(5); // Once per character
    expect(mockOnChange).toHaveBeenLastCalledWith('Hello');
  });
});
```

### Example: PasswordInput Component Test

```typescript
// tests/unit/components/PasswordInput.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from '@/components/molecules/PasswordInput';

describe('PasswordInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render password input with label', () => {
      render(<PasswordInput value="" onChange={mockOnChange} />);

      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter a strong password')).toBeInTheDocument();
    });

    it('should render password as hidden by default', () => {
      render(<PasswordInput value="test123" onChange={mockOnChange} />);

      const input = screen.getByLabelText('Password') as HTMLInputElement;
      expect(input.type).toBe('password');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle visibility when eye icon clicked', async () => {
      const user = userEvent.setup();
      render(<PasswordInput value="TestPass123!" onChange={mockOnChange} />);

      const input = screen.getByLabelText('Password') as HTMLInputElement;
      expect(input.type).toBe('password');

      const toggleButton = screen.getByRole('button', { name: /toggle/i });
      await user.click(toggleButton);

      expect(input.type).toBe('text');

      await user.click(toggleButton);

      expect(input.type).toBe('password');
    });
  });

  describe('Strength Indicator', () => {
    it('should show weak for short passwords', () => {
      render(<PasswordInput value="Pass1!" onChange={mockOnChange} />);

      expect(screen.getByText('Password strength:')).toBeInTheDocument();
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('should show strong for complex passwords', () => {
      render(<PasswordInput value="MyV3ry$ecur3P@ssw0rd!" onChange={mockOnChange} />);

      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  describe('Requirements Checklist', () => {
    it('should show requirements on focus', async () => {
      const user = userEvent.setup();
      render(<PasswordInput value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText('Password');

      expect(screen.queryByText('Password must contain:')).not.toBeInTheDocument();

      await user.click(input);

      expect(screen.getByText('Password must contain:')).toBeInTheDocument();
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    });

    it('should mark requirements as met', () => {
      render(<PasswordInput value="TestPassword123!" onChange={mockOnChange} />);

      expect(screen.getByText('Password must contain:')).toBeInTheDocument();
      // All requirements should be visible and checked
    });
  });

  describe('Error Display', () => {
    it('should display error message when provided', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          error="Password is required"
        />
      );

      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('should apply error styling to input', () => {
      render(
        <PasswordInput
          value=""
          onChange={mockOnChange}
          error="Too weak"
        />
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('border-danger-300');
    });
  });
});
```

### Testing Forms

```typescript
describe('LoginForm', () => {
  it('should submit with valid credentials', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<LoginForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'TestPass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPass123!',
      });
    });
  });

  it('should show validation errors', async () => {
    const user = userEvent.setup();

    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });
});
```

### Testing Loading & Async States

```typescript
describe('Async Loading', () => {
  it('should show loading state during submission', async () => {
    const user = userEvent.setup();

    // Create a promise we can control
    let resolveSubmit: (value: boolean) => void;
    const submitPromise = new Promise<boolean>((resolve) => {
      resolveSubmit = resolve;
    });

    const mockOnSubmit = vi.fn().mockReturnValue(submitPromise);

    render(<LoginForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'TestPass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Check loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeDisabled();

    // Resolve the promise
    resolveSubmit!(true);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
    });
  });
});
```

---

## 🔗 Writing Integration Tests

Integration tests verify multiple components/modules work together correctly.

### Example: Onboarding Flow

```typescript
// tests/integration/onboarding-flow.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';
import { setupStorageMocks, clearAllStorage } from '@tests/__mocks__/localStorage';

describe('Renter Onboarding Flow', () => {
  beforeEach(() => {
    setupStorageMocks();
  });

  afterEach(() => {
    clearAllStorage();
  });

  it('should complete full onboarding flow', async () => {
    const user = userEvent.setup();

    render(<App />);

    // Step 1: Select renter role
    await user.click(screen.getByRole('button', { name: /renter/i }));

    // Step 2: Enter email and password
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'TestPassword123!');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3: Enter profile details
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Phone'), '07700900000');
    await user.click(screen.getByRole('button', { name: /complete/i }));

    // Verify dashboard loaded
    expect(await screen.findByText('Welcome, John Doe')).toBeInTheDocument();
    expect(screen.getByText('Find Properties')).toBeInTheDocument();
  });
});
```

### Example: Authentication Flow

```typescript
describe('Authentication Integration', () => {
  it('should login, update profile, and logout', async () => {
    const user = userEvent.setup();

    render(<App />);

    // Login
    await user.click(screen.getByRole('button', { name: /login/i }));
    await user.type(screen.getByLabelText('Email'), 'existing@example.com');
    await user.type(screen.getByLabelText('Password'), 'ExistingPass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for dashboard
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();

    // Update profile
    await user.click(screen.getByRole('button', { name: /profile/i }));
    await user.clear(screen.getByLabelText('Phone'));
    await user.type(screen.getByLabelText('Phone'), '07700900123');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText('Profile updated')).toBeInTheDocument();

    // Logout
    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(await screen.findByText('Welcome to PropertySwipe')).toBeInTheDocument();
  });
});
```

---

## 🎭 Mocking Strategies

### Mocking Modules

```typescript
// Mock entire module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Mock specific function
vi.mock('@/utils/validation', () => ({
  validatePassword: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));
```

### Mocking Supabase

```typescript
// tests/__mocks__/supabase.ts
import { vi } from 'vitest';

export const createMockSupabaseClient = () => {
  const mockDatabase = new Map();

  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const records = Array.from(mockDatabase.values()).filter(
              (r) => r[column] === value
            );
            return { data: records[0] || null, error: null };
          },
        }),
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            const id = crypto.randomUUID();
            const record = { ...data, id };
            mockDatabase.set(id, record);
            return { data: record, error: null };
          },
        }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              // Update logic
              return { data: updatedRecord, error: null };
            },
          }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => async () => {
          // Delete logic
          return { error: null };
        },
      }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
};

export const getMockDatabase = () => mockDatabase;
export const clearMockDatabase = () => mockDatabase.clear();
```

### Mocking Hooks

```typescript
// Mock useAuthStore
vi.mock('@/hooks/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: false,
    currentUser: null,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Test with specific mock return value
it('should show user name when authenticated', () => {
  vi.mocked(useAuthStore).mockReturnValue({
    isAuthenticated: true,
    currentUser: { id: '1', name: 'John Doe' },
    login: vi.fn(),
    logout: vi.fn(),
  });

  render(<Dashboard />);

  expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
});
```

### Mocking timers

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('should debounce search input', async () => {
  const mockOnSearch = vi.fn();

  render(<SearchInput onSearch={mockOnSearch} />);

  const input = screen.getByRole('textbox');
  await userEvent.type(input, 'test');

  // Advance timers by 300ms (debounce delay)
  vi.advanceTimersByTime(300);

  expect(mockOnSearch).toHaveBeenCalledTimes(1);
  expect(mockOnSearch).toHaveBeenCalledWith('test');
});
```

---

## ✨ Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad** (testing implementation details):
```typescript
it('should update state', () => {
  const component = render(<MyComponent />);
  const instance = component.instance();

  instance.setState({ count: 5 });

  expect(instance.state.count).toBe(5);
});
```

✅ **Good** (testing user-facing behavior):
```typescript
it('should increment counter when button clicked', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button', { name: /increment/i }));

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 2. Use User-Centric Queries

**Query Priority** (from most to least preferred):

1. **Accessible to everyone**:
   - `getByRole` - Best for buttons, inputs, etc.
   - `getByLabelText` - Best for form fields
   - `getByPlaceholderText` - Inputs with placeholders
   - `getByText` - Non-interactive text
   - `getByDisplayValue` - Form elements with values

2. **Semantic queries**:
   - `getByAltText` - Images
   - `getByTitle` - Elements with title attribute

3. **Test IDs** (last resort):
   - `getByTestId` - Use only when nothing else works

```typescript
// ✅ Good
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');
screen.getByText('Welcome back');

// ❌ Bad
screen.getByTestId('submit-button');
screen.getByClassName('email-input');
```

### 3. Avoid Testing Libraries

Don't test React, Tailwind, or other libraries:

```typescript
// ❌ Bad - testing React's rendering
it('should render a div', () => {
  const { container } = render(<MyComponent />);
  expect(container.querySelector('div')).toBeInTheDocument();
});

// ✅ Good - testing your component's behavior
it('should display user name', () => {
  render(<MyComponent user={{ name: 'John' }} />);
  expect(screen.getByText('John')).toBeInTheDocument();
});
```

### 4. One Assertion Per Test (Generally)

```typescript
// ❌ Bad - multiple unrelated assertions
it('should work correctly', async () => {
  render(<LoginForm />);
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
  expect(screen.getByLabelText('Password')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeEnabled();
  // ... 10 more assertions
});

// ✅ Good - focused tests
describe('LoginForm', () => {
  it('should render email input', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should render password input', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should enable submit button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
  });
});
```

### 5. Use `beforeEach` for Common Setup

```typescript
describe('MyComponent', () => {
  let mockOnClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupStorageMocks();
    mockOnClick = vi.fn();
  });

  afterEach(() => {
    clearAllStorage();
    vi.clearAllMocks();
  });

  it('test 1', () => {
    render(<MyComponent onClick={mockOnClick} />);
    // Test implementation
  });

  it('test 2', () => {
    render(<MyComponent onClick={mockOnClick} />);
    // Test implementation
  });
});
```

### 6. Use `waitFor` for Async Operations

```typescript
it('should show success message after save', async () => {
  const user = userEvent.setup();
  render(<ProfileForm />);

  await user.click(screen.getByRole('button', { name: /save/i }));

  // ✅ Good - wait for async operation
  await waitFor(() => {
    expect(screen.getByText('Profile saved successfully')).toBeInTheDocument();
  });
});
```

### 7. Test Edge Cases

```typescript
describe('Password Validation', () => {
  // Normal cases
  it('should accept valid password', () => {
    expect(validatePassword('TestPass123!').isValid).toBe(true);
  });

  // Edge cases
  it('should handle empty string', () => {
    expect(validatePassword('').isValid).toBe(false);
  });

  it('should handle null input', () => {
    expect(validatePassword(null).isValid).toBe(false);
  });

  it('should handle very long passwords', () => {
    const longPassword = 'A'.repeat(1000) + 'a1!';
    expect(validatePassword(longPassword).isValid).toBe(true);
  });

  it('should handle special characters', () => {
    expect(validatePassword('Test!@#$%^&*()123').isValid).toBe(true);
  });

  it('should handle unicode characters', () => {
    expect(validatePassword('Tëst123!Pässw0rd').isValid).toBe(true);
  });
});
```

---

## 🔍 Common Patterns

### Pattern: Testing Form Validation

```typescript
describe('Form Validation', () => {
  it('should show error for invalid email', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
  });

  it('should clear error on valid input', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    // Trigger error
    await user.type(screen.getByLabelText('Email'), 'invalid');
    await user.tab(); // Blur

    expect(screen.getByText('Invalid email address')).toBeInTheDocument();

    // Fix error
    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'valid@example.com');

    expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument();
  });
});
```

### Pattern: Testing Conditional Rendering

```typescript
describe('Conditional Rendering', () => {
  it('should show loading state', () => {
    render(<DataDisplay isLoading={true} data={null} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<DataDisplay isLoading={false} data={null} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should show data when available', () => {
    const mockData = [{ id: 1, name: 'Item 1' }];
    render(<DataDisplay isLoading={false} data={mockData} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });
});
```

### Pattern: Testing Lists

```typescript
describe('Property List', () => {
  it('should render all properties', () => {
    const properties = [
      { id: '1', title: 'Property 1', rent: 1000 },
      { id: '2', title: 'Property 2', rent: 1200 },
      { id: '3', title: 'Property 3', rent: 900 },
    ];

    render(<PropertyList properties={properties} />);

    properties.forEach((property) => {
      expect(screen.getByText(property.title)).toBeInTheDocument();
      expect(screen.getByText(`£${property.rent}/month`)).toBeInTheDocument();
    });
  });

  it('should call onSelect with correct property', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();
    const properties = [
      { id: '1', title: 'Property 1', rent: 1000 },
      { id: '2', title: 'Property 2', rent: 1200 },
    ];

    render(<PropertyList properties={properties} onSelect={mockOnSelect} />);

    await user.click(screen.getByText('Property 2'));

    expect(mockOnSelect).toHaveBeenCalledWith(properties[1]);
  });
});
```

### Pattern: Testing Error Boundaries

```typescript
describe('ErrorBoundary', () => {
  it('should catch and display errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });
});
```

---

## 🐛 Debugging Tests

### Using `screen.debug()`

```typescript
it('should render correctly', () => {
  render(<MyComponent />);

  // Print entire document
  screen.debug();

  // Print specific element
  screen.debug(screen.getByRole('button'));
});
```

### Using `logRoles()`

```typescript
import { logRoles } from '@testing-library/react';

it('should have correct roles', () => {
  const { container } = render(<MyComponent />);

  // Print all available roles
  logRoles(container);
});
```

### Debugging Queries

```typescript
// See all available queries
screen.getByRole('button'); // Throws if not found, shows all roles

// Use query variant to check existence
expect(screen.queryByRole('button')).not.toBeInTheDocument();

// Use find variant for async
await screen.findByRole('button'); // Waits up to 1000ms
```

### Debugging Async Issues

```typescript
it('should handle async operation', async () => {
  render(<AsyncComponent />);

  // Debug: Check what's rendered before waiting
  screen.debug();

  // Wait for element
  const element = await screen.findByText('Loaded');

  // Debug: Check what's rendered after waiting
  screen.debug();

  expect(element).toBeInTheDocument();
});
```

### VS Code Debugging

1. Add breakpoint in test file
2. Run test in debug mode:
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Vitest",
     "runtimeExecutable": "npm",
     "runtimeArgs": ["run", "test"],
     "console": "integratedTerminal",
     "internalConsoleOptions": "neverOpen"
   }
   ```

---

## 📊 Coverage

### Running Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

### Coverage Thresholds

Configured in [vitest.config.ts](../vitest.config.ts):

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    lines: 80,
    branches: 80,
    functions: 80,
    statements: 80,
  },
}
```

### Interpreting Coverage

**Lines**: Percentage of code lines executed
**Branches**: Percentage of conditional branches taken (if/else, switch, ternary)
**Functions**: Percentage of functions called
**Statements**: Percentage of statements executed

**Example**:
```typescript
function divide(a: number, b: number) {
  if (b === 0) {        // Branch 1
    return null;        // Not covered
  }
  return a / b;         // Covered
}

// Test only calls divide(10, 2)
// Lines: 75% (3/4 lines)
// Branches: 50% (1/2 branches)
// Functions: 100% (1/1 functions)
```

### Ignoring Coverage

```typescript
/* istanbul ignore next */
function debugOnlyFunction() {
  console.log('Debug info');
}
```

---

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm run test:run

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test:run
npm run lint
npx tsc --noEmit
```

---

## 📚 Additional Resources

### Internal Documentation
- [Testing Implementation Status](../TESTING_IMPLEMENTATION_STATUS.md)
- [Development Setup Guide](./DEVELOPMENT_SETUP_GUIDE.md)
- [RRA 2025 Compliance Guide](./RRA_2025_COMPLIANCE_GUIDE.md)

### External Resources
- [Vitest Documentation](https://vitest.dev)
- [Testing Library Docs](https://testing-library.com)
- [Kent C. Dodds - Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)

---

**Last Updated**: 2025-01-09
**Version**: 1.0
**Maintained By**: PropertySwipe Development Team

**Questions?** Reach out to the testing team or open an issue.
