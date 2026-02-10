# LetRight — Authentication & Onboarding PRD

**Product:** LetRight (Tinder-style rental property matching platform)
**Scope:** Authentication, session management, role-based onboarding
**Target Users:** Tenants, landlords, estate agents (broad, non-technical UK audience)
**Stack:** Supabase Auth, React (frontend framework TBC)

---

## 1. Goals

- **Zero-friction sign-up/sign-in:** Users should be able to go from landing page to using the app in under 30 seconds.
- **No passwords:** Eliminate password-based auth entirely to avoid reset flows and reduce support burden.
- **Role-aware onboarding:** After auth, route users into the correct experience (tenant / landlord / agent) without complicating the login screen.
- **Reliable sessions:** Users should rarely need to re-authenticate. Rental searching is sporadic — sessions must persist across days/weeks.
- **Debuggable:** All auth events should be logged and observable. Failures should surface clear errors to both developers and users.

---

## 2. Auth Methods (Priority Order)

### 2.1 Google OAuth (Primary)

- Use `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- Covers the majority of users across Android, desktop, and many iOS users.
- Configure in Supabase Dashboard → Authentication → Providers → Google.
- Required scopes: `email`, `profile` (defaults).
- Redirect URL must be configured in both Google Cloud Console and Supabase.

### 2.2 Apple OAuth (Primary)

- Use `supabase.auth.signInWithOAuth({ provider: 'apple' })`.
- **Required** if the app is distributed via the iOS App Store (Apple policy mandates Apple Sign-In if any social login is offered).
- Handle Apple's "Hide My Email" relay — store the relay email and treat it as a valid contact method.
- Configure in Supabase Dashboard → Authentication → Providers → Apple.
- Requires Apple Developer account, Services ID, and key configuration.

### 2.3 Magic Link — Email OTP (Secondary)

- Use `supabase.auth.signInWithOtp({ email })`.
- Fallback for users who don't want social login (common with estate agents using work email addresses).
- **Custom SMTP is required** — do not use Supabase's default email. Use Resend, Postmark, or similar for reliable delivery and deliverability monitoring.
- Configure branded email template in Supabase Dashboard → Authentication → Email Templates.
- Template should be branded with LetRight logo and clear CTA button.
- Set magic link expiry to 10 minutes.

### 2.4 Not Implementing

| Method | Reason |
|--------|--------|
| Email + password | Adds reset flow complexity; users forget passwords between sporadic sessions |
| Phone/SMS OTP | Expensive at scale, carrier delivery issues, adds Twilio dependency |
| GitHub / Discord / other social | Irrelevant for target audience |
| Microsoft OAuth | **Consider post-launch** for estate agency users on M365, but not MVP |

---

## 3. UI / UX Specification

### 3.1 Login / Sign-Up Screen

There is **one unified auth screen** — no separate sign-up vs sign-in flows. Supabase automatically creates an account on first OAuth/magic link use and signs in on subsequent uses.

**Layout (mobile-first):**

```
┌─────────────────────────────┐
│                             │
│        [LetRight Logo]      │
│     Find your perfect match │
│                             │
│  ┌─────────────────────────┐│
│  │ 🔵 Continue with Google ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ ⬛ Continue with Apple  ││
│  └─────────────────────────┘│
│                             │
│     ──── or ────            │
│                             │
│  ┌─────────────────────────┐│
│  │ Enter your email        ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │   Send me a login link  ││
│  └─────────────────────────┘│
│                             │
│  By continuing you agree to │
│  our Terms & Privacy Policy │
│                             │
└─────────────────────────────┘
```

**Key UX rules:**

- Button text is **"Continue with..."** not "Sign up with..." or "Log in with..." — this handles both cases and reduces cognitive load.
- Google and Apple buttons are large, prominent, full-width.
- Email/magic link is visually secondary (smaller section below a divider).
- After magic link is sent, show a confirmation screen: "Check your email — we've sent a login link to [email]. It expires in 10 minutes." Include a "Resend" button with a 60-second cooldown.
- Terms of Service and Privacy Policy links in footer (required for Apple review).

### 3.2 Magic Link Email Template

- **From:** hello@letright.co.uk (or similar branded address)
- **Subject:** "Your LetRight login link"
- **Body:** Branded, minimal. LetRight logo, one-line message ("Click below to sign in to LetRight"), prominent CTA button, expiry notice, "If you didn't request this, you can safely ignore it."

### 3.3 Post-Auth: Role Selection Screen

Shown **only on first login** (when no `profiles` row exists for the user).

```
┌─────────────────────────────┐
│                             │
│     Welcome to LetRight!    │
│     How will you use the    │
│     platform?               │
│                             │
│  ┌─────────────────────────┐│
│  │ 🏠 I'm looking for a   ││
│  │    place to rent        ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🔑 I'm a landlord      ││
│  │    with properties      ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🏢 I'm an estate agent ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

**Rules:**

- Role selection is mandatory — user cannot proceed without choosing.
- Role is stored in `profiles.role` and determines which UI experience they see.
- A user may later request to switch or add a role (e.g., a tenant who becomes a landlord) — handle this via a settings page, not a second account. For MVP, role switching can be manual (support request). Post-MVP, allow users to toggle roles in settings.
- Do **not** encode role in the auth layer or JWT — it's application-level data.

### 3.4 Post-Role Routing

| Role | Next Screen |
|------|-------------|
| Tenant | Preference setup wizard → swipe interface |
| Landlord | Property listing flow → dashboard |
| Estate Agent | Agency setup / property listing → dashboard |

*(These flows are out of scope for this PRD but noted for context.)*

---

## 4. Database Schema

### 4.1 Profiles Table

```sql
-- Profiles table: created after first auth + role selection
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('tenant', 'landlord', 'agent')),
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile (role selection)
create policy "Users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Index for role-based queries
create index idx_profiles_role on public.profiles(role);
```

### 4.2 Auto-Populate Email and Avatar on Auth

Use a Supabase database function triggered on new user creation to seed profile-adjacent data, or handle this client-side during the role selection step by reading from the auth session:

```sql
-- Optional: trigger to create a skeleton profile row on signup
-- (role will be null until the user selects it on the role selection screen)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Note:** If using the trigger approach, the `role` column must be nullable initially (change `not null` to allow null), and the role selection screen updates the existing row. Alternatively, skip the trigger and create the profile row entirely during role selection. **Recommended approach:** skip the trigger, create the full profile row (including role) during role selection. This avoids null-role states.

---

## 5. Session Management

### 5.1 Client-Side Session Handling

```javascript
// Single source of truth for auth state
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    // Handle: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
    // Route user based on session presence and profile existence
  }
);
```

- **Do not** build custom session tracking. Use `onAuthStateChange` exclusively.
- On app load, check for existing session and profile:
  1. Session exists + profile with role → route to role-appropriate home screen.
  2. Session exists + no profile / null role → route to role selection.
  3. No session → route to login screen.

### 5.2 Server-Side Validation

- Use `supabase.auth.getUser()` (not `getSession()`) for any server-side checks. `getUser()` validates the JWT against Supabase; `getSession()` only reads the local token.
- If using SSR (Next.js, SvelteKit, etc.), use the `@supabase/ssr` package (not the deprecated `@supabase/auth-helpers`). This handles cookie-based PKCE sessions correctly.

### 5.3 Session Configuration

Configure in Supabase Dashboard → Authentication → Settings:

- **JWT expiry:** 1 hour (default, fine as-is).
- **Refresh token expiry:** Set to **30 days** minimum. Users browse rentals sporadically — don't force re-auth after a few days of inactivity.
- **Refresh token reuse interval:** 10 seconds (default).

---

## 6. Error Handling & Edge Cases

### 6.1 Magic Link Delivery Failures

- If the user reports not receiving the email:
  1. Show "Check your spam/junk folder" message.
  2. Offer "Resend" button (60-second cooldown between sends).
  3. After 2 failed resends, suggest trying Google/Apple sign-in instead.
- Monitor delivery rates via custom SMTP provider dashboard.

### 6.2 OAuth Errors

- If OAuth redirect fails, show a user-friendly error: "Something went wrong signing in with [Provider]. Please try again or use a different method."
- Log the full error object (`error.message`, `error.status`) for debugging.
- Common issues: misconfigured redirect URLs, provider app not verified (Google), Apple key expiry.

### 6.3 Duplicate Accounts

- Supabase links accounts by email by default. If a user signs in with Google (john@gmail.com) and later uses a magic link for john@gmail.com, they access the same account.
- Ensure "Enable automatic linking" is turned **on** in Supabase Dashboard → Authentication → Settings.
- Edge case: Apple "Hide My Email" creates a relay address that won't match the user's real email. These will be separate accounts. Document this for support team.

### 6.4 Account Deletion

- GDPR requires account deletion capability. Implement a "Delete my account" option in settings.
- Use Supabase Admin API to delete the auth.users row, and cascade to profiles via the foreign key.

---

## 7. Security

### 7.1 Row Level Security (RLS)

- RLS must be **enabled on every table from day one**. No exceptions.
- All policies use `auth.uid()` to scope access.
- Landlords/agents can only see and edit their own listings.
- Tenants can only see and edit their own profile and preferences.
- Match data should be scoped so both parties can read but neither can modify the other's data.

### 7.2 API Key Handling

- **Anon key** (public): Used in client-side code. Safe to expose — RLS protects data.
- **Service role key** (secret): Never expose to client. Use only in server-side functions or Supabase Edge Functions.
- Store keys in environment variables, never in source code.

### 7.3 Rate Limiting

- Supabase has built-in rate limiting on auth endpoints. Defaults are sufficient for launch.
- Magic link: Supabase limits to 1 email per 60 seconds per address (configurable).

---

## 8. Observability & Debugging

### 8.1 Development

- Enable debug mode on the Supabase client during development:

```javascript
const supabase = createClient(url, anonKey, {
  auth: { debug: true }
});
```

- This logs all auth state changes, token refreshes, and errors to the browser console.

### 8.2 Production

- **Supabase Dashboard → Authentication → Users:** Check user records, providers, last sign-in, confirmation status.
- **Supabase Dashboard → Logs:** Filter by auth API calls to see errors, rate limits, and failed attempts.
- **Custom SMTP provider dashboard:** Monitor email delivery rates, bounces, and spam complaints for magic links.
- Wrap all auth calls in try/catch and log structured errors:

```javascript
try {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) {
    console.error('[Auth Error]', { message: error.message, status: error.status });
    // Show user-friendly error
  }
} catch (err) {
  console.error('[Auth Exception]', err);
}
```

### 8.3 Alerting (Post-MVP)

- Set up alerts for: auth error rate spikes, magic link delivery rate drops, unusual signup volume (potential abuse).

---

## 9. Implementation Checklist

### Phase 1: Core Auth (MVP)

- [ ] Set up Supabase project and configure auth settings
- [ ] Configure Google OAuth provider (Google Cloud Console + Supabase)
- [ ] Configure Apple OAuth provider (Apple Developer + Supabase)
- [ ] Set up custom SMTP for magic link emails (Resend or Postmark)
- [ ] Design and customise magic link email template
- [ ] Create `profiles` table with RLS policies
- [ ] Build unified login/signup screen (Google, Apple, magic link)
- [ ] Build magic link "check your email" confirmation screen with resend
- [ ] Build role selection screen (tenant / landlord / agent)
- [ ] Implement `onAuthStateChange` listener for session management
- [ ] Implement routing logic: no session → login, session + no role → role select, session + role → home
- [ ] Configure refresh token expiry to 30+ days
- [ ] Enable automatic account linking in Supabase settings
- [ ] Enable debug mode for development
- [ ] Test full flow for all 3 auth methods × 3 roles
- [ ] Test edge cases: expired magic link, cancelled OAuth, duplicate email across providers

### Phase 2: Hardening (Post-Launch)

- [ ] Add account deletion flow (GDPR compliance)
- [ ] Add Microsoft OAuth for estate agency users
- [ ] Add role switching in user settings
- [ ] Set up production error logging and alerting
- [ ] Monitor and optimise magic link delivery rates
- [ ] Add "agency team" support (multiple agents under one org)

---

## 10. Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  # server-side only, never expose
```

*(Google and Apple OAuth credentials are configured in Supabase Dashboard, not in app env vars.)*

---

## 11. Dependencies

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Core Supabase client |
| `@supabase/ssr` | SSR session handling (if using Next.js/SvelteKit) |

No additional auth libraries needed. Supabase handles everything.
