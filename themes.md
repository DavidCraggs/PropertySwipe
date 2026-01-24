# Dashboard Theme Customization System

Implementation plan for allowing agencies and landlords to customize their dashboard themes with persistent settings.

---

## Background

PropertySwipe currently uses a fixed color scheme defined in `index.css` via Tailwind CSS with CSS custom properties (`--color-primary-*`, `--color-secondary-*`, etc.). This plan enables users to personalize their dashboard appearance.

### Current State
- Theming: Tailwind CSS with CSS variables in [index.css](file:///c:/Users/david/PropertySwipe/src/index.css)
- Dashboards: [AgencyDashboard.tsx](file:///c:/Users/david/PropertySwipe/src/pages/AgencyDashboard.tsx), [VendorDashboard.tsx](file:///c:/Users/david/PropertySwipe/src/pages/VendorDashboard.tsx)
- No per-user theme customization exists

---

## Proposed Changes

### Database Layer

#### [NEW] [20260124_theme_preferences.sql](file:///c:/Users/david/PropertySwipe/supabase/migrations/20260124_theme_preferences.sql)
Create table for storing user theme preferences:
```sql
CREATE TABLE theme_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('landlord', 'agency')),
  
  -- Color Theme
  primary_color TEXT DEFAULT '#14b8a6',
  secondary_color TEXT DEFAULT '#f97316',
  accent_color TEXT DEFAULT '#6366f1',
  
  -- Branding
  logo_url TEXT,
  company_name_display TEXT,
  
  -- UI Preferences
  dark_mode BOOLEAN DEFAULT false,
  compact_mode BOOLEAN DEFAULT false,
  sidebar_collapsed BOOLEAN DEFAULT false,
  
  -- Pre-built themes
  preset_theme TEXT DEFAULT 'default' CHECK (preset_theme IN (
    'default', 'ocean', 'forest', 'sunset', 'midnight', 'custom'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

---

### Types & Interfaces

#### [MODIFY] [types/index.ts](file:///c:/Users/david/PropertySwipe/src/types/index.ts)
Add theme-related type definitions:
```typescript
export interface ThemePreferences {
  id?: string;
  userId: string;
  userType: 'landlord' | 'agency';
  
  // Colors (hex format)
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Branding
  logoUrl?: string;
  companyNameDisplay?: string;
  
  // UI Settings
  darkMode: boolean;
  compactMode: boolean;
  sidebarCollapsed: boolean;
  
  // Preset
  presetTheme: PresetTheme;
}

export type PresetTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'custom';
```

---

### Theme Service

#### [NEW] [services/ThemeService.ts](file:///c:/Users/david/PropertySwipe/src/services/ThemeService.ts)
Service for managing theme operations:
- `getThemePreferences(userId)`: Fetch user's theme settings
- `saveThemePreferences(prefs)`: Save/update preferences
- `applyTheme(prefs)`: Apply CSS variables to document root
- `getPresetTheme(name)`: Get predefined theme values
- `resetToDefault(userId)`: Reset to platform defaults

**Preset Themes:**
| Theme | Primary | Secondary | Accent | Dark |
|-------|---------|-----------|--------|------|
| Default | Teal #14b8a6 | Orange #f97316 | Indigo #6366f1 | No |
| Ocean | Blue #0ea5e9 | Cyan #06b6d4 | Sky #38bdf8 | No |
| Forest | Emerald #10b981 | Lime #84cc16 | Green #22c55e | No |
| Sunset | Orange #f97316 | Rose #f43f5e | Amber #f59e0b | No |
| Midnight | Slate #475569 | Indigo #6366f1 | Purple #a855f7 | Yes |

---

### Theme Context & Hook

#### [NEW] [hooks/useTheme.ts](file:///c:/Users/david/PropertySwipe/src/hooks/useTheme.ts)
React hook for theme management:
```typescript
export function useTheme() {
  // Returns: { theme, setTheme, applyTheme, isLoading, presets }
}
```

#### [NEW] [contexts/ThemeContext.tsx](file:///c:/Users/david/PropertySwipe/src/contexts/ThemeContext.tsx)
Provider that wraps App and applies theme on mount/change.

---

### UI Components

#### [NEW] [components/organisms/ThemeCustomizer.tsx](file:///c:/Users/david/PropertySwipe/src/components/organisms/ThemeCustomizer.tsx)
Modal/panel for theme customization:
- Preset theme selector (cards with previews)
- Color pickers for primary/secondary/accent
- Logo upload field
- Dark mode toggle
- Compact mode toggle
- Live preview panel
- Reset to default button

#### [MODIFY] [App.tsx](file:///c:/Users/david/PropertySwipe/src/App.tsx)
Wrap with `ThemeProvider`, apply theme CSS variables on load.

#### [MODIFY] [pages/ProfilePage.tsx](file:///c:/Users/david/PropertySwipe/src/pages/ProfilePage.tsx)
Add "Customize Theme" button/section linking to ThemeCustomizer.

---

### Storage Layer

#### [MODIFY] [lib/storage.ts](file:///c:/Users/david/PropertySwipe/src/lib/storage.ts)
Add functions:
- `saveThemePreferences(prefs: ThemePreferences): Promise<ThemePreferences>`
- `getThemePreferences(userId: string): Promise<ThemePreferences | null>`

---

## User Review Required

> [!IMPORTANT]
> **Branding Questions:**
> 1. Should agencies be able to upload custom logos? (Storage implications)
> 2. Should theme extend to email templates/notifications?
> 3. Should renters see the landlord/agency's custom theme?

> [!NOTE]
> **Scope Limitation:** This plan covers landlord and agency dashboards only. Renter dashboards use the platform default theme.

---

## Verification Plan

### Manual Verification
1. **Theme Persistence Test**
   - Log in as landlord → Settings → Customize Theme
   - Select "Forest" preset → Save
   - Refresh page → Verify theme persists
   - Log out and log back in → Theme still applied

2. **Custom Color Test**
   - Select "Custom" preset
   - Use color picker to set primary to `#ff0000`
   - Verify dashboard header/buttons change to red
   - Save and refresh → Color persists

3. **Dark Mode Test**
   - Toggle dark mode ON
   - Verify background changes to dark
   - Verify text remains readable
   - Toggle OFF → Returns to light mode

### Suggested User Testing
> [!TIP]
> Would you like to specify any particular color schemes or branding requirements to validate during testing?
