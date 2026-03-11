# Orcas Designer — UI/UX Redesign Design Document

## Context

Orcas Designer is a tool for designers to create design prompts for Claude. The target audience is designers, so the app itself must be impeccably designed. The current implementation is functional but visually generic — monochromatic palette, no animations, Inter font, flat cards, disconnected dark sidebar.

## Aesthetic Direction

**Creative Tool** — Expressive, vibrant, professional. Think Figma meets Linear. Motion is a core part of the personality.

---

## 1. Color System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `oklch(0.55 0.25 270)` — Electric indigo | Buttons, active states, primary actions |
| Accent 1 | `oklch(0.75 0.15 195)` — Cyan/teal | Progress, success, secondary highlights |
| Accent 2 | `oklch(0.55 0.20 300)` — Violet/purple | Badges, skill categories, hover accents |
| Background | `oklch(0.985 0.005 270)` — Warm off-white (blue tint) | Page background |
| Card | `oklch(1 0 0)` — White | Card surfaces |
| Border | `oklch(0.92 0.01 270)` — Blue-gray | Subtle borders |
| Destructive | `oklch(0.65 0.20 25)` — Coral red | Delete, errors |
| Muted Foreground | `oklch(0.45 0.03 270)` — Cool gray | Secondary text |

**Gradients:**
- Hero gradient: indigo → violet (wizard header, empty states)
- Progress gradient: indigo → cyan (progress bars/rings)

**Shadows (blue-tinted):**
- `shadow-sm`: Cards at rest
- `shadow-md`: Hover elevation
- `shadow-lg`: Dialogs, floating elements

## 2. Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Headings | Plus Jakarta Sans | 600, 700 | Geometric, slightly rounded, friendly |
| Body | DM Sans | 400, 500 | Clean, geometric, excellent readability |
| Mono | JetBrains Mono | 400, 500 | Prompt preview, code content |

## 3. Layout — Top Navigation (replaces sidebar)

- **Fixed top bar** ~56px, frosted glass (`backdrop-blur-xl` + semi-transparent bg)
- **Left:** Logo — Waves icon with indigo→cyan gradient + "Orcas Designer" wordmark (Plus Jakarta Sans 700)
- **Center:** 4 nav links as pill-shaped tabs (Dashboard, New Project, Shared Skills, Shared Memories). Active = indigo fill, inactive = ghost.
- **Right:** Reserved slot (theme toggle, settings — empty for now)
- **Bottom edge:** 1px gradient border (indigo → cyan → transparent) — signature detail
- **Content:** Full-width, max-w-5xl default, max-w-6xl for wizard

## 4. Wizard — Vertical Stepper

Two-panel layout:

### Left Panel (280px, sticky)
- All 13 steps listed vertically
- Each step: number circle + label + status icon (checkmark/dot/asterisk)
- Active step: indigo background pill, white text, slight scale
- Completed: cyan checkmark, muted text
- Upcoming: gray number, light text
- Grouped by section with subtle dividers:
  - "Context" (steps 0-3)
  - "Design Assets" (steps 4-8)
  - "Configuration" (steps 9-12)
- Clickable — jump to any step
- Vertical progress bar on left edge (indigo → cyan gradient fill)

### Right Panel (flexible)
- Animated step transitions (slide + fade, directional)
- Step title + description + category badge at top
- Required steps: subtle indigo left border accent
- Navigation buttons at bottom

## 5. Dashboard — Rich Project Cards

**Grid:** 1/2/3 columns responsive, gap-5

**Card anatomy:**
- `rounded-2xl`, layered blue-tinted shadow, white bg
- **Top:** Project name (Plus Jakarta Sans 600) + relative time ("2 hours ago")
- **Middle:** 4 status indicator chips (icon + label):
  - Figma link (green if set, gray if empty)
  - Output type (Image/Play + label)
  - Skills count (Wand2 + number)
  - Memories count (Brain + number)
- **Bottom:** Circular progress ring (indigo→cyan gradient stroke) with % center + "X of 9 fields" + action buttons (Open primary, Delete ghost)
- **Hover:** Lift with shadow-md + scale-[1.01], 200ms

**Empty state:**
- Large gradient circle (indigo→violet) with Palette icon (white, gentle pulse animation)
- Plus Jakarta Sans 600 headline
- Gradient CTA button (indigo→violet) with hover glow

## 6. Motion & Animation (Framer Motion)

| Interaction | Animation | Timing |
|-------------|-----------|--------|
| Page transitions | Fade + upward slide | 150ms |
| Wizard step change | Cross-fade with directional slide | 200ms, spring |
| Card hover | Lift + shadow expansion | 200ms ease-out |
| Button press | Scale to 0.97, spring back | 100ms + spring |
| Dashboard cards mount | Staggered fade-in | 50ms stagger |
| Progress bar/ring | Spring animation on value change | Spring |
| Dialog open | Scale from 95% + fade + backdrop blur | 150ms |
| Copy action | Check icon scale + rotate entrance | 200ms spring |
| File upload drop | Pulse on drag-over, checkmark on drop | 300ms |
| Wizard completion | Particle burst | 1-2s |

## 7. Component Refinements

- **Buttons:** Active press scale-down. Primary gradient (indigo→violet). Ghost = indigo text on hover.
- **Cards:** Shadow system replaces ring borders. Hover elevation. rounded-2xl.
- **Inputs:** h-9 height. Indigo ring glow on focus. Italic placeholder.
- **Badges:** Color per category — Design=violet, Superpowers=indigo, Figma=cyan, Atlassian=blue, Claude Management=teal, Meta=amber
- **Tabs:** Active = indigo fill + white text (pill). Inactive = transparent + hover bg.
- **Dialogs:** rounded-2xl, stronger backdrop blur, subtle gradient top edge accent.
- **File upload:** Gradient dashed border (indigo→cyan) on hover/drag, animated icon.

## 8. Skills & Memories Pages

- Category headers get colored left border accent matching badge color
- View dialog: colored category badge, styled code block for invocation with copy button
- Memory view: styled scroll area, code blocks get background, headers get weight

## 9. Prompt Preview

- Syntax-highlighted sections — headers in indigo, code blocks in dark rounded containers, URLs as cyan links
- Copy button with icon morph animation (Copy → Check, spring)
- Floating action bar at bottom when scrolling long prompts

## 10. Badge Category Colors

| Category | Color Token |
|----------|-------------|
| Design | Violet |
| Superpowers | Indigo |
| Figma | Cyan |
| Atlassian | Blue |
| Claude Management | Teal |
| Meta | Amber |
