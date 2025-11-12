# PropertySwipe Development Setup Guide

Complete guide for setting up your development environment and contributing to PropertySwipe.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Project Structure](#project-structure)
4. [Running the Application](#running-the-application)
5. [Testing](#testing)
6. [Code Quality Tools](#code-quality-tools)
7. [Git Workflow](#git-workflow)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)
10. [Resources](#resources)

---

## 🔧 Prerequisites

### Required Software

Install the following before beginning:

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Node.js** | 18.x or 20.x | JavaScript runtime | [Download](https://nodejs.org/) |
| **npm** | 9.x+ | Package manager | Included with Node.js |
| **Git** | 2.x+ | Version control | [Download](https://git-scm.com/) |
| **VS Code** | Latest | Code editor (recommended) | [Download](https://code.visualstudio.com/) |

### Recommended VS Code Extensions

Install these for the best development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ZixuanChen.vitest-explorer",
    "dsznajder.es7-react-js-snippets",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space for dependencies

---

## 🚀 Initial Setup

### 1. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/yourusername/PropertySwipe.git

# Or using SSH (recommended for contributors)
git clone git@github.com:yourusername/PropertySwipe.git

cd PropertySwipe
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- **React 18.3.1** - UI framework
- **TypeScript 5.x** - Type safety
- **Vite 6.x** - Build tool
- **Tailwind CSS 3.x** - Styling
- **Vitest 3.2.4** - Testing framework
- **Supabase 2.48.x** - Backend & database
- **Additional tools** - See [package.json](../package.json)

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Add your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Development Settings
VITE_ENV=development
VITE_API_TIMEOUT=5000
```

**Where to find Supabase credentials**:
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Navigate to Settings → API
4. Copy **Project URL** and **anon public** key

### 4. Initialize Database

Run the database schema setup:

```bash
# Copy the SQL schema to your Supabase SQL Editor
# File: supabase-schema-multirole.sql
```

**Steps**:
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Paste contents of [supabase-schema-multirole.sql](../supabase-schema-multirole.sql)
5. Run the query

This creates:
- Tables: `renter_profiles`, `landlord_profiles`, `agency_profiles`, `properties`, `matches`, etc.
- Row Level Security (RLS) policies
- Database functions
- Triggers

### 5. Verify Setup

```bash
# Run the development server
npm run dev

# In another terminal, run tests
npm run test:run
```

**Expected Output**:
```
✓ Test Files  6 passed (6)
✓ Tests       224 passed (224)
Duration      5.83s

Dev server running at: http://localhost:5173
```

---

## 📁 Project Structure

```
PropertySwipe/
├── docs/                           # Documentation
│   ├── RRA_2025_COMPLIANCE_GUIDE.md
│   ├── DEVELOPMENT_SETUP_GUIDE.md
│   └── TESTING_GUIDE.md
│
├── src/                            # Source code
│   ├── components/                 # React components
│   │   ├── atoms/                  # Small, reusable components
│   │   ├── molecules/              # Composite components
│   │   │   └── PasswordInput.tsx
│   │   └── organisms/              # Complex components
│   │
│   ├── hooks/                      # Custom React hooks
│   │   └── useAuthStore.ts         # Authentication state
│   │
│   ├── lib/                        # External service integrations
│   │   ├── supabase.ts             # Supabase client
│   │   └── storage.ts              # Database operations
│   │
│   ├── pages/                      # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RoleSelectionScreen.tsx
│   │   ├── RenterOnboarding.tsx
│   │   ├── LandlordOnboarding.tsx
│   │   ├── AgencyOnboarding.tsx
│   │   └── Dashboard.tsx
│   │
│   ├── types/                      # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── utils/                      # Utility functions
│   │   ├── validation.ts           # Password & input validation
│   │   └── messageValidation.ts    # RRA 2025 compliance
│   │
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # App entry point
│   └── index.css                   # Global styles (Tailwind)
│
├── tests/                          # Test files
│   ├── __mocks__/                  # Mock implementations
│   │   ├── supabase.ts             # Supabase mock
│   │   └── localStorage.ts         # LocalStorage mock
│   │
│   ├── unit/                       # Unit tests
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   │
│   ├── integration/                # Integration tests
│   ├── e2e/                        # End-to-end tests
│   ├── setup.ts                    # Test configuration
│   └── utils/                      # Test helpers
│
├── public/                         # Static assets
├── .env                            # Environment variables (DO NOT COMMIT)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── package.json                    # Project dependencies
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite build config
├── vitest.config.ts                # Vitest test config
├── tailwind.config.js              # Tailwind CSS config
├── postcss.config.js               # PostCSS config
└── README.md                       # Project overview
```

### Key Directories

- **`src/components/`**: Organized by [Atomic Design](https://atomicdesign.bradfrost.com/) principles
- **`src/hooks/`**: Zustand stores and custom hooks
- **`src/lib/`**: Third-party integrations (Supabase, etc.)
- **`src/pages/`**: Route-level components
- **`src/utils/`**: Pure functions and helpers
- **`tests/`**: Matches src/ structure

---

## 🏃 Running the Application

### Development Server

```bash
npm run dev
```

- **URL**: http://localhost:5173
- **Hot Module Replacement (HMR)**: Enabled
- **Source Maps**: Enabled for debugging

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Build output in `dist/` directory.

### Environment-Specific Commands

```bash
# Development with custom port
npm run dev -- --port 3000

# Build with type checking
npm run build

# Preview on different port
npm run preview -- --port 8080
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests (watch mode)
npm run test

# Run all tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Watch specific file
npm run test messageValidation
```

### Test Structure

**224 tests across 6 test files**:

| File | Tests | Category |
|------|-------|----------|
| `validation.test.ts` | 62 | Password validation, hashing, strength |
| `useAuthStore.test.ts` | 32 | Authentication logic |
| `PasswordInput.test.tsx` | 34 | Password input component |
| `LoginPage.test.tsx` | 20 | Login page component |
| `messageValidation.test.ts` | 75 | RRA 2025 compliance |
| `simple.test.ts` | 1 | Setup verification |

### Writing Tests

**Example unit test**:

```typescript
import { describe, it, expect } from 'vitest';
import { validatePassword } from '@/utils/validation';

describe('Password Validation', () => {
  it('should reject passwords shorter than 8 characters', () => {
    const result = validatePassword('Pass1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least 8 characters');
  });
});
```

**Example component test**:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from '@/components/molecules/PasswordInput';

describe('PasswordInput', () => {
  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<PasswordInput value="" onChange={() => {}} />);

    const input = screen.getByPlaceholderText('Enter a strong password') as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggleButton = screen.getAllByRole('button')[0];
    await user.click(toggleButton);

    expect(input.type).toBe('text');
  });
});
```

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing documentation.

### Code Coverage

```bash
npm run test:coverage
```

**Current Coverage Goals**:
- **Lines**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Statements**: 80%

Coverage report: `coverage/index.html`

---

## 🎨 Code Quality Tools

### TypeScript

Type checking:

```bash
# Check types without building
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

**tsconfig.json highlights**:
- Strict mode enabled
- Path aliases: `@/*` → `src/*`, `@tests/*` → `tests/*`
- JSX: React 18

### Linting (ESLint)

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

**Rules**:
- Extends `@typescript-eslint/recommended`
- React Hooks rules
- Accessibility rules (eslint-plugin-jsx-a11y)

### Formatting (Prettier)

```bash
# Check formatting
npx prettier --check .

# Fix formatting
npx prettier --write .
```

**VS Code**: Enable "Format on Save"
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### Git Hooks (Husky)

Pre-commit hooks run automatically:
- Type checking
- Linting
- Tests for changed files
- Prettier formatting

To bypass (not recommended):
```bash
git commit --no-verify
```

---

## 🌳 Git Workflow

### Branching Strategy

**Main Branches**:
- `main` - Production-ready code
- `develop` - Integration branch (if using)

**Feature Branches**:
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b fix/bug-description
```

**Naming Convention**:
- `feature/add-property-search`
- `fix/login-validation-error`
- `refactor/auth-store`
- `test/add-rra-compliance-tests`
- `docs/update-setup-guide`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactor (no functional change)
- `test`: Add/update tests
- `docs`: Documentation changes
- `style`: Code style (formatting, semicolons, etc.)
- `chore`: Build process, dependencies, etc.

**Examples**:

```bash
# Good commits
git commit -m "feat(auth): implement password-based login"
git commit -m "fix(rra): prevent false positive for 'no more' pattern"
git commit -m "test(validation): add 75 RRA 2025 compliance tests"
git commit -m "docs(setup): add development environment guide"

# Bad commits
git commit -m "fixed bug"
git commit -m "WIP"
git commit -m "updates"
```

### Pull Request Process

1. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push to remote**:
   ```bash
   git push -u origin feature/your-feature
   ```

4. **Create Pull Request** on GitHub:
   - Clear title and description
   - Link related issues
   - Request reviewers
   - Ensure CI passes (tests, linting, type checking)

5. **Address feedback**:
   ```bash
   # Make changes
   git add .
   git commit -m "fix: address PR feedback"
   git push
   ```

6. **Merge** (after approval):
   - Squash and merge (preferred)
   - Rebase and merge (for clean history)
   - Delete branch after merge

---

## 🛠️ Common Tasks

### Adding a New Component

```bash
# Create component file
touch src/components/molecules/MyComponent.tsx

# Create test file
touch tests/unit/components/MyComponent.test.tsx
```

**Component Template**:

```tsx
// src/components/molecules/MyComponent.tsx
import { FC } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold">{title}</h2>
      <button
        onClick={onAction}
        className="mt-2 px-4 py-2 bg-primary-600 text-white rounded"
      >
        Action
      </button>
    </div>
  );
};
```

**Test Template**:

```tsx
// tests/unit/components/MyComponent.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/molecules/MyComponent';

describe('MyComponent', () => {
  it('should render with title', () => {
    render(<MyComponent title="Test Title" onAction={() => {}} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should call onAction when button clicked', async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn();

    render(<MyComponent title="Test" onAction={mockAction} />);

    await user.click(screen.getByRole('button', { name: /action/i }));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});
```

### Adding a Database Table

1. **Update SQL schema** ([supabase-schema-multirole.sql](../supabase-schema-multirole.sql)):

```sql
-- Create new table
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
ON my_table FOR SELECT
USING (auth.uid() = user_id);
```

2. **Add TypeScript types** ([src/types/index.ts](../src/types/index.ts)):

```typescript
export interface MyTable {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

3. **Create database functions** ([src/lib/storage.ts](../src/lib/storage.ts)):

```typescript
export async function saveMyTable(data: Omit<MyTable, 'id' | 'created_at' | 'updated_at'>) {
  const { data: result, error } = await supabase
    .from('my_table')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}
```

4. **Write tests**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { saveMyTable } from '@/lib/storage';
import { setupStorageMocks, clearAllStorage } from '@tests/__mocks__/localStorage';

describe('MyTable Storage', () => {
  beforeEach(() => {
    setupStorageMocks();
  });

  afterEach(() => {
    clearAllStorage();
  });

  it('should save data to my_table', async () => {
    const data = { name: 'Test Name' };
    const result = await saveMyTable(data);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Name');
  });
});
```

### Adding a New Page

1. **Create page component** ([src/pages/MyPage.tsx](../src/pages/MyPage.tsx)):

```tsx
import { FC } from 'react';

export const MyPage: FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">My Page</h1>
    </div>
  );
};
```

2. **Add route** ([src/App.tsx](../src/App.tsx)):

```tsx
import { MyPage } from './pages/MyPage';

// In your router
<Route path="/my-page" element={<MyPage />} />
```

3. **Write tests**:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyPage } from '@/pages/MyPage';

describe('MyPage', () => {
  it('should render page title', () => {
    render(<MyPage />);
    expect(screen.getByText('My Page')).toBeInTheDocument();
  });
});
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all to latest (within semver range)
npm update

# Update specific package
npm update package-name

# Update to latest major version (breaking changes)
npm install package-name@latest
```

**After updating**:
1. Run tests: `npm run test:run`
2. Check type errors: `npx tsc --noEmit`
3. Test the app: `npm run dev`

---

## 🐛 Troubleshooting

### Issue: `npm install` fails

**Symptoms**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
```

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lockfile
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Tests fail with module resolution errors

**Symptoms**:
```
Error: Cannot find module '@/utils/validation'
```

**Solutions**:
1. Check [vitest.config.ts](../vitest.config.ts) has correct path aliases:
   ```typescript
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
       '@tests': path.resolve(__dirname, './tests'),
     }
   }
   ```

2. Restart Vitest:
   ```bash
   # Kill existing test process
   pkill -f vitest

   # Restart
   npm run test
   ```

### Issue: TypeScript errors in tests

**Symptoms**:
```
Property 'toBeInTheDocument' does not exist on type 'JestMatchers<HTMLElement>'
```

**Solution**:
Ensure [tests/setup.ts](../tests/setup.ts) imports matchers:
```typescript
import '@testing-library/jest-dom/vitest';
```

### Issue: Supabase connection errors

**Symptoms**:
```
Error: Invalid Supabase URL
```

**Solutions**:
1. Check `.env` file exists and has correct values
2. Verify Supabase project is active
3. Check API keys are not expired
4. Test connection:
   ```typescript
   import { supabase } from './lib/supabase';

   const { data, error } = await supabase.from('renter_profiles').select('count');
   console.log('Connection test:', data, error);
   ```

### Issue: Hot Module Replacement (HMR) not working

**Symptoms**: Changes don't reflect in browser

**Solutions**:
```bash
# Restart dev server
npm run dev

# Or try building
npm run build && npm run preview
```

### Issue: Port already in use

**Symptoms**:
```
Error: Port 5173 is already in use
```

**Solutions**:
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

---

## 📚 Resources

### Documentation

- **Internal Docs**:
  - [Testing Guide](./TESTING_GUIDE.md)
  - [RRA 2025 Compliance Guide](./RRA_2025_COMPLIANCE_GUIDE.md)
  - [Testing Implementation Status](../TESTING_IMPLEMENTATION_STATUS.md)

- **External Docs**:
  - [React Documentation](https://react.dev)
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/)
  - [Vite Guide](https://vitejs.dev/guide/)
  - [Vitest Documentation](https://vitest.dev)
  - [Tailwind CSS Docs](https://tailwindcss.com/docs)
  - [Supabase Documentation](https://supabase.com/docs)

### Learning Resources

- **React Testing**:
  - [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
  - [Kent C. Dodds Blog](https://kentcdodds.com/blog)

- **TypeScript**:
  - [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
  - [Type Challenges](https://github.com/type-challenges/type-challenges)

- **Tailwind CSS**:
  - [Tailwind Play](https://play.tailwindcss.com/)
  - [Tailwind Components](https://tailwindcomponents.com/)

### Community & Support

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Pull Requests**: Contribute code
- **Code Reviews**: Learn from feedback

---

## ✅ Setup Checklist

Use this checklist when setting up a new development environment:

- [ ] Install Node.js 18.x or 20.x
- [ ] Install Git
- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Create `.env` file with Supabase credentials
- [ ] Run database schema in Supabase SQL Editor
- [ ] Start dev server (`npm run dev`)
- [ ] Run tests (`npm run test:run`)
- [ ] Verify 224 tests pass
- [ ] Install recommended VS Code extensions
- [ ] Configure VS Code settings (format on save)
- [ ] Read [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- [ ] Read [RRA_2025_COMPLIANCE_GUIDE.md](./RRA_2025_COMPLIANCE_GUIDE.md)
- [ ] Review [TESTING_IMPLEMENTATION_STATUS.md](../TESTING_IMPLEMENTATION_STATUS.md)
- [ ] Join team communication channels
- [ ] Introduce yourself to the team

---

**Last Updated**: 2025-01-09
**Version**: 1.0
**Maintained By**: PropertySwipe Development Team

**Questions?** Open an issue or reach out to the team lead.

**Ready to contribute?** Check out open issues labeled `good first issue`!
