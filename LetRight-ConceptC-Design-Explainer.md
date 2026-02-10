# LetRight — Concept C Design Explainer

## For use as input to generate a comprehensive PRD

---

## 1. Product Overview

**Product Name:** LetRight
**Tagline:** "Swipe Right. Let Right."
**Category:** Rental property matching platform (UK market)
**Concept:** Tinder-style swipe mechanic applied to residential lettings — tenants swipe through curated rental listings, shortlisting properties they like and dismissing ones they don't. Landlords/agents see which tenants matched with their properties.
**Target Market:** UK renters, initially focused on London boroughs
**Platform:** Mobile-first responsive web app (React), designed for iOS Safari and Android Chrome with desktop support

---

## 2. Design Philosophy

### Creative Direction: "Virgil Abloh meets real estate"

The design borrows from streetwear and fashion-forward UI culture. Property listings are treated like product drops — each card feels like an announcement rather than a classified ad. The aesthetic is bold, typographic, and high-contrast, with deliberate use of quotation marks as decorative elements (a signature Abloh motif — putting things "in quotes" to recontextualise them).

### Why this works for LetRight

- **Differentiates from Rightmove/Zoopla/OpenRent** — those are search-and-filter tools. LetRight is an experience.
- **Appeals to younger renters (22–35)** who are visually literate and expect app-quality interactions
- **The swipe mechanic demands a card-based UI** — this design makes each card feel like it deserves attention
- **Property type labels in quotes** (e.g. "CONVERTED WAREHOUSE") add personality and frame each listing as something worth discovering

### Design Principles

1. **Typography is the hero** — no stock photography dependency. Display type carries the visual weight.
2. **Light mode favoured** — warm off-white (#f3f1eb) base, not clinical white. Dark mode is a toggle, not the default.
3. **Teal is the single accent** — used sparingly for CTAs, price, active states, and the brand mark. Everything else is monochrome.
4. **Motion is functional, not decorative** — swipe physics feel real, transitions are fast, nothing loops or pulses gratuitously.
5. **Mobile-first, thumb-zone optimised** — all primary actions are in the bottom 40% of the viewport.

---

## 3. Brand Identity

### Logo Treatment

- **Wordmark only**, no icon/symbol
- Display font: **Bebas Neue** (all caps)
- "LET" in teal (#0d9488 light / #2dd4bf dark), "RIGHT" in primary text colour
- Letter-spacing: 4px
- Font size: 28px in header
- Tagline sits directly below in Libre Franklin, 9px, weight 800, letter-spacing 3px, all caps, wrapped in quotation marks: "SWIPE RIGHT. LET RIGHT."

### Colour System

#### Light Mode (default)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#f3f1eb` | Page background — warm parchment off-white |
| `card` | `#ffffff` | Card surfaces |
| `text` | `#0a0a0a` | Primary text — near-black |
| `sub` | `#8a8680` | Secondary text, labels, metadata |
| `line` | `#dfdbd2` | Borders, dividers, card outlines |
| `teal` | `#0d9488` | Primary accent — brand, prices, active nav, CTA |
| `nav` | `rgba(243,241,235,0.92)` | Bottom nav with backdrop blur |
| `glow` | `rgba(13,148,136,0.08)` | Box shadow for teal CTA button |

#### Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#07080a` | Page background — near-black with subtle warmth |
| `card` | `#111214` | Card surfaces |
| `text` | `#eeebe4` | Primary text — warm off-white |
| `sub` | `#5e5e5e` | Secondary text |
| `line` | `#1d1f23` | Borders, dividers |
| `teal` | `#2dd4bf` | Primary accent — brighter in dark mode for contrast |
| `nav` | `rgba(7,8,10,0.92)` | Bottom nav with backdrop blur |
| `glow` | `rgba(45,212,191,0.1)` | Box shadow for teal CTA button |

#### Swipe Feedback Colours

| Colour | Hex | Usage |
|--------|-----|-------|
| Teal/Green | `#34d399` | YES stamp text, shortlist toast |
| Red | `#f87171` | NO stamp text |
| Red (toast) | `#ef4444` | Pass toast background |
| Blue | `#60a5fa` | Undo button |
| Gold | `#fbbf24` | Super-like / star button |

### Typography

| Role | Font | Weight | Size | Spacing | Case |
|------|------|--------|------|---------|------|
| Display headings | Bebas Neue | 400 (only weight) | 28–44px | 2–6px | UPPERCASE |
| Property names | Bebas Neue | 400 | 32px | 2px | UPPERCASE |
| Price | Bebas Neue | 400 | 36px | 1px | — |
| Decorative quote mark | Bebas Neue | 400 | 40px | — | — |
| Body / labels | Libre Franklin | 500–900 | 9–13px | 0.5–3px | Mixed |
| Property type label | Bebas Neue | 400 | 13px | 3px | UPPERCASE, wrapped in " " |
| Nav items | Libre Franklin | 900 | 9px | 2.5px | UPPERCASE |
| Metadata | Libre Franklin | 600–800 | 10–12px | 1.5–2px | UPPERCASE |

**Key typographic decisions:**
- Bebas Neue is only available in a single weight — hierarchy is created through size and colour, never weight
- Libre Franklin handles all readable text and comes in weights 400–900
- Letter-spacing is generous throughout — minimum 0.5px on body, 2–3px on labels
- Everything UI-related (nav, labels, metadata) is uppercase

### Theme Switching

- Transition: `background 0.5s, color 0.5s` on root container
- Toggle button in header: "LIGHT" / "DARK" text, Libre Franklin 9px weight 900, letter-spacing 2px
- Button style: transparent background, 1.5px solid border using `line` token, border-radius 6px, padding 6px 10px

---

## 4. Layout Architecture

### Viewport Structure

```
┌─────────────────────────┐
│ HEADER (fixed height)   │  ~50px
├─────────────────────────┤
│                         │
│   CARD STACK            │  flex: 1 (fills remaining space)
│   (swipeable area)      │
│                         │
├─────────────────────────┤
│ ACTION BUTTONS          │  ~70px
├─────────────────────────┤
│ BOTTOM NAV (fixed)      │  ~56px (12px top + 28px bottom for safe area)
└─────────────────────────┘
```

- Max width: 520px, centred with `margin: 0 auto`
- Full viewport height: `height: 100vh`
- Overflow: hidden on root (no page scroll — the card stack is the entire experience)
- Flex column layout for vertical stacking

### Header

- Padding: 14px 20px 6px
- Left: Brand wordmark + tagline stacked
- Right: Dark/light toggle button + user avatar (34×34px teal rounded square with initial)
- z-index: 20

### Card Stack Area

- `flex: 1` to fill vertical space
- Padding: 10px 14px 0
- Position: relative (cards are absolute-positioned children)
- Shows up to 3 cards stacked with depth illusion
- Entry animation: opacity 0→1, translateY 14px→0, 0.5s ease with 0.15s delay

### Action Buttons

- Padding: 10px 0 6px
- Flex row, centred, gap 14px
- z-index: 20
- Entry animation: `up 0.4s ease 0.25s both`
- Four circular buttons (see Section 6)

### Bottom Navigation

- Position: implied fixed at bottom of flex layout
- Background: nav token (semi-transparent) with `backdrop-filter: blur(20px)`
- Border-top: 1px solid line token
- Padding: 12px 0 28px (28px bottom accommodates iOS safe area / home indicator)
- Four tabs evenly spaced

---

## 5. Card Design (The Core UI Element)

### Card Structure

Each card is a full-height element within the stack area, with two zones:

```
┌──────────────────────────┐
│                          │
│    IMAGE / GRADIENT      │  48% of card height
│    ZONE                  │
│                          │
│  [Match %]     [YES/NO]  │
│        [emoji]           │
│  "PROPERTY TYPE"         │
├──────────────────────────┤
│ "                        │  ← decorative quote mark
│ PROPERTY NAME            │
│ POSTCODE · AREA          │
│                          │
│ £X,XXX  PCM              │
│ ─────────────────────    │
│ [tag] [tag] [tag]        │
│                          │
│ X BED · AVAILABLE NOW    │
└──────────────────────────┘
```

### Image Zone (Top 48%)

- Background: 155-degree linear gradient unique to each property (3 colour stops: deep → mid → light)
- Centred emoji at 76px with drop-shadow filter
- **Match badge:** top-left, `rgba(0,0,0,0.25)` background, `backdrop-filter: blur(12px)`, border-radius 10px, shows percentage
- **Property type label:** bottom-left, Bebas Neue 13px, letter-spacing 3px, wrapped in quotation marks, `rgba(255,255,255,0.6)`
- **Swipe stamps:** "YES" (top-left, green #34d399, rotated -8deg) and "NO" (top-right, red #f87171, rotated +8deg) — opacity controlled by drag distance

### Content Zone (Bottom 52%)

- Padding: 18px 20px 16px
- Flex column layout
- **Decorative opening quote mark:** Bebas Neue 40px, teal colour, opacity 0.3, line-height 0.6
- **Property name:** Bebas Neue 32px, letter-spacing 2px, all caps
- **Location:** Libre Franklin 12px, weight 600, letter-spacing 1.5px, sub colour, format "POSTCODE · AREA NAME"
- **Price:** Bebas Neue 36px in teal + "PCM" label in Libre Franklin 10px weight 700, letter-spacing 2px
- **Feature tags:** flex row with wrap, gap 6px. Each tag: Libre Franklin 11px weight 600, sub colour, 1px solid border using line token, border-radius 6px, padding 4px 10px
- **Footer metadata:** pinned to bottom with `margin-top: auto`. Libre Franklin 10px weight 800, letter-spacing 2px, sub colour, format "X BED · AVAILABLE NOW"

### Card Container Styling

- Border-radius: 20px
- Border: 1.5px solid line token
- Box shadow (top card only): `0 20px 50px rgba(0,0,0,0.06)` light / `rgba(0,0,0,0.5)` dark
- Background: card token
- Overflow: hidden

### Card Stack Depth Effect

Up to 3 cards rendered simultaneously:

| Card | Scale | Y Offset | Opacity | Z-Index |
|------|-------|----------|---------|---------|
| Top (active) | 1.0 | 0px | 1.0 | 10 |
| Second | 0.96 | 10px | 0.72 | 9 |
| Third | 0.92 | 20px | 0.44 | 8 |

Formula:
- Scale: `1 - index × 0.04`
- Y offset: `index × 10px`
- Opacity: `1 - index × 0.28`

---

## 6. Swipe Mechanic (Critical Interaction)

### Touch/Mouse Drag

- Only the top card (index 0) is interactive
- Touch and mouse events both supported
- `touchAction: none` on card to prevent browser scroll interference
- `userSelect: none` to prevent text selection during drag
- Cursor: `grab` on top card, `default` on stack cards

### Drag Physics

- **Horizontal movement:** 1:1 with finger/cursor (no dampening on X axis)
- **Vertical movement:** dampened to 25% (`deltaY × 0.25`) — allows slight vertical drift without overwhelming the horizontal swipe
- **Rotation:** `deltaX × 0.055` degrees — card tilts naturally in swipe direction
- **No transition during active drag** — movement is instant/frame-locked
- **Spring-back on release (below threshold):** `0.5s cubic-bezier(0.34, 1.56, 0.64, 1)` — overshoots slightly for a bouncy feel

### Swipe Threshold

- **100px horizontal displacement** triggers a swipe
- Below 100px: card springs back to centre
- Above 100px: card exits

### Swipe Stamps (YES / NO)

- **YES stamp:** appears when dragging right, positioned top-left of image zone
  - Bebas Neue 44px, colour #34d399, rotated -8deg, letter-spacing 6px
  - Text shadow: `0 4px 16px rgba(52,211,153,0.4)`
  - Opacity formula: `clamp(0, (deltaX - 20) / 60, 1)` — starts fading in after 20px, fully visible at 80px
- **NO stamp:** appears when dragging left, positioned top-right of image zone
  - Same styling but colour #f87171, rotated +8deg
  - Opacity formula: `clamp(0, (-deltaX - 20) / 60, 1)`

### Exit Animation

- Direction: `translateX(±550px)` + `rotate(±20deg)`
- Duration: `0.38s cubic-bezier(0.4, 0, 0.2, 1)` — fast ease-out
- Opacity: fades to 0
- After 360ms delay, the card is removed from the deck and next card becomes active

### Empty State

When all cards are swiped:
- Centred vertically in the stack area
- Symbol: ◉ (56px? — use large geometric glyph)
- Heading: "DONE" in Bebas Neue 34px, letter-spacing 4px
- Subtext: "Check back tomorrow for new drops." in Libre Franklin 13px, sub colour, weight 500

---

## 7. Action Buttons

Four circular buttons arranged horizontally below the card stack:

| Button | Icon | Size | Colour | Background | Function |
|--------|------|------|--------|------------|----------|
| Pass | ✕ | 48px | #ef4444 | Transparent, 2px solid border | Swipe left (dismiss) |
| Undo | ↩ | 40px | #60a5fa | Transparent, 2px solid border | Undo last swipe |
| Like | ♥ | 58px (largest) | #ffffff | Solid teal with glow shadow | Swipe right (shortlist) |
| Super Like | ★ | 48px | #fbbf24 | Transparent, 2px solid border | Premium action |

### Button Interactions

- **Hover:** `scale(1.1)` with `0.2s cubic-bezier(0.34, 1.56, 0.64, 1)` — spring bounce
- **Like button shadow:** `0 6px 24px` using glow token
- All buttons use border-radius: 50% (perfect circles)
- Pass and Like buttons trigger the same swipe animation as dragging

---

## 8. Toast Notifications

Triggered on swipe completion:

- **Shortlist toast:** teal background, white text, "♥ SHORTLISTED"
- **Pass toast:** red (#ef4444) background, white text, "✕ PASSED"
- Position: absolute, top 68px, centred horizontally, z-index 60
- Font: Libre Franklin 12px, weight 900, letter-spacing 2px
- Border-radius: 10px, padding 7px 18px
- Animation: `toast 0.65s ease forwards`
  - 0%: opacity 0, scale 0.92
  - 15%: opacity 1, scale 1
  - 80%: hold
  - 100%: opacity 0, scale 0.97, translateY -4px

---

## 9. Bottom Navigation

Four tabs, evenly spaced:

| Tab | Label | Active State |
|-----|-------|-------------|
| Discover | DISCOVER | Teal text + underline indicator |
| Matches | MATCHES | Sub colour |
| Chat | CHAT | Sub colour |
| You | YOU | Sub colour |

### Tab Styling

- Font: Libre Franklin 9px, weight 900, letter-spacing 2.5px, uppercase
- Active indicator: 2.5px tall bar, teal, positioned 3px below text, 70% width (left 15%, right 15%), border-radius 2px
- Inactive: sub colour

### Nav Container

- Semi-transparent background with 20px backdrop blur
- Top border: 1px solid line token
- Padding: 12px top, 28px bottom (iOS safe area)

---

## 10. Animation Inventory

| Name | Trigger | Duration | Easing | Effect |
|------|---------|----------|--------|--------|
| `up` | Page load | 0.4s | ease | translateY(14px→0), opacity(0→1) |
| `toast` | Swipe action | 0.65s | ease | Scale pop-in, hold, fade out |
| Card spring-back | Drag release < threshold | 0.5s | cubic-bezier(0.34,1.56,0.64,1) | Bouncy return to origin |
| Card exit | Swipe > threshold | 0.38s | cubic-bezier(0.4,0,0.2,1) | Fly off screen with rotation |
| Theme transition | Toggle | 0.5s | ease | Background and colour crossfade |
| Button hover | Mouse enter | 0.2s | cubic-bezier(0.34,1.56,0.64,1) | Scale to 1.1 with spring |
| Stagger entrance | Page load | 0.4s per element | ease | Header → cards → buttons, 0.05–0.25s delays |

---

## 11. Property Data Model

Each property card requires:

```typescript
interface Property {
  id: string;
  name: string;                    // Display name, e.g. "THE PRINTWORKS"
  type: string;                    // Category, e.g. "CONVERTED WAREHOUSE"
  area: string;                    // Format: "POSTCODE · AREA", e.g. "SE1 · BERMONDSEY"
  rentPcm: number;                 // Monthly rent in GBP
  beds: number;                    // 0 = studio
  matchPercentage: number;         // 0–100, shown on card
  features: string[];              // 2–4 short feature tags
  images: string[];                // Photo URLs (gradient placeholder in prototype)
  availableNow: boolean;           // Availability flag
  gradient: string;                // CSS gradient for image placeholder
}
```

---

## 12. Responsive Behaviour

- **Max width:** 520px container, centred
- **Below 520px:** Full-bleed, padding handles spacing
- **Above 520px:** Centred card with page background visible either side
- **No horizontal scroll** — card drag is handled via transforms, not scroll
- **Safe area:** 28px bottom padding on nav for iOS home indicator
- **Viewport lock:** `height: 100vh`, `overflow: hidden` — no page scroll, app-like feel

---

## 13. Accessibility Notes for PRD

- Swipe actions must have button equivalents (pass/like buttons below cards)
- Cards should be focusable with keyboard, arrow keys to navigate, Enter to like, Backspace to pass
- Colour contrast ratios: teal on white ≥ 4.5:1, teal on dark bg ≥ 4.5:1
- Reduced motion preference: disable card rotation and spring-back, use simple opacity transitions
- Screen reader: cards announced with property name, price, match percentage, bed count
- Toast notifications should be aria-live regions

---

## 14. What This Explainer Does NOT Cover (for the PRD to define)

- User authentication and onboarding flow
- Renter profile creation (preferences, budget, location radius)
- Landlord/agent-side dashboard
- Match notification system and logic
- Messaging between matched renters and landlords
- Listing creation and management
- Search filters and preference settings
- Payment/subscription model
- Backend API design and data architecture
- Push notification strategy
- Analytics and tracking
- Legal requirements (UK lettings regulations, data protection)

---

## 15. Reference Implementation

The working React prototype is attached as `conceptC.jsx`. It demonstrates the complete swipe mechanic, card stack rendering, theme switching, toast notifications, and all animation timings. It uses inline styles (no CSS framework) and mock data. The PRD should specify how to translate this into a production architecture using a proper component library, state management, and CSS-in-JS or Tailwind approach.
