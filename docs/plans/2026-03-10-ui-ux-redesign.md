# UI/UX Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Orcas Designer from a generic CRUD app into a polished, vibrant creative tool worthy of a designer audience — with electric indigo/cyan palette, Plus Jakarta Sans typography, top navigation, vertical stepper wizard, rich project cards, and expressive motion.

**Architecture:** Foundation-up approach: update CSS tokens and fonts first, then layout (sidebar → top nav), then UI primitives, then page-level components (dashboard, wizard, detail), then motion polish. Each task builds on the previous without breaking the app.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui v4 (base-ui), motion (framer-motion), Plus Jakarta Sans + DM Sans + JetBrains Mono (Google Fonts), lucide-react icons.

**Design Doc:** `docs/plans/2026-03-10-ui-ux-redesign-design.md`

---

## Task 1: Install Motion Library

**Files:**
- Modify: `package.json`

**Step 1: Install motion**

Run: `npm install motion`

**Step 2: Verify install**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install motion library for animations"
```

---

## Task 2: Update Fonts — Plus Jakarta Sans + DM Sans + JetBrains Mono

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Update font imports in layout.tsx**

Replace the Inter import and font config with:

```tsx
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from "next/font/google"

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
})

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})
```

Update the body className to include all three font variables:
```tsx
<body className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
```

**Step 2: Update globals.css @theme to add heading font**

In the `@theme inline` block, add:
```css
--font-heading: var(--font-heading);
```

**Step 3: Verify**

Run: `npx next build`
Expected: Builds successfully

**Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: replace Inter with Plus Jakarta Sans, DM Sans, JetBrains Mono"
```

---

## Task 3: Update Color Palette — Electric Indigo/Cyan/Violet

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Replace the `:root` CSS variables**

Replace the entire `:root` block with the new palette:

```css
:root {
  --background: oklch(0.985 0.005 270);
  --foreground: oklch(0.145 0.02 270);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0.02 270);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0.02 270);
  --primary: oklch(0.55 0.25 270);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.95 0.02 270);
  --secondary-foreground: oklch(0.30 0.05 270);
  --muted: oklch(0.95 0.01 270);
  --muted-foreground: oklch(0.45 0.03 270);
  --accent: oklch(0.75 0.15 195);
  --accent-foreground: oklch(0.20 0.05 195);
  --destructive: oklch(0.65 0.20 25);
  --border: oklch(0.92 0.01 270);
  --input: oklch(0.92 0.01 270);
  --ring: oklch(0.55 0.25 270);
  --chart-1: oklch(0.55 0.25 270);
  --chart-2: oklch(0.75 0.15 195);
  --chart-3: oklch(0.55 0.20 300);
  --chart-4: oklch(0.65 0.15 220);
  --chart-5: oklch(0.60 0.10 170);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.55 0.25 270);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.95 0.02 270);
  --sidebar-accent-foreground: oklch(0.30 0.05 270);
  --sidebar-border: oklch(0.92 0.01 270);
  --sidebar-ring: oklch(0.55 0.25 270);

  /* Custom tokens */
  --color-violet: oklch(0.55 0.20 300);
  --color-cyan: oklch(0.75 0.15 195);
  --color-indigo: oklch(0.55 0.25 270);
  --color-amber: oklch(0.75 0.17 75);
  --color-teal: oklch(0.70 0.12 175);
}
```

**Step 2: Update the `.dark` block**

```css
.dark {
  --background: oklch(0.13 0.02 270);
  --foreground: oklch(0.95 0.01 270);
  --card: oklch(0.18 0.02 270);
  --card-foreground: oklch(0.95 0.01 270);
  --popover: oklch(0.18 0.02 270);
  --popover-foreground: oklch(0.95 0.01 270);
  --primary: oklch(0.65 0.22 270);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.22 0.02 270);
  --secondary-foreground: oklch(0.90 0.01 270);
  --muted: oklch(0.22 0.02 270);
  --muted-foreground: oklch(0.65 0.03 270);
  --accent: oklch(0.70 0.15 195);
  --accent-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.70 0.19 22);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.65 0.22 270);
  --chart-1: oklch(0.65 0.22 270);
  --chart-2: oklch(0.70 0.15 195);
  --chart-3: oklch(0.60 0.18 300);
  --chart-4: oklch(0.60 0.15 220);
  --chart-5: oklch(0.55 0.10 170);
  --sidebar: oklch(0.16 0.02 270);
  --sidebar-foreground: oklch(0.95 0.01 270);
  --sidebar-primary: oklch(0.65 0.22 270);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.22 0.02 270);
  --sidebar-accent-foreground: oklch(0.90 0.01 270);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.65 0.22 270);
}
```

**Step 3: Add custom CSS utilities to globals.css (after @layer base)**

```css
@layer utilities {
  .font-heading {
    font-family: var(--font-heading), ui-sans-serif, system-ui, sans-serif;
  }
  .gradient-primary {
    background: linear-gradient(135deg, oklch(0.55 0.25 270), oklch(0.55 0.20 300));
  }
  .gradient-accent {
    background: linear-gradient(135deg, oklch(0.55 0.25 270), oklch(0.75 0.15 195));
  }
  .gradient-border {
    background: linear-gradient(90deg, oklch(0.55 0.25 270), oklch(0.75 0.15 195), transparent);
  }
  .shadow-card {
    box-shadow:
      0 1px 2px oklch(0.55 0.10 270 / 0.04),
      0 2px 8px oklch(0.55 0.10 270 / 0.06);
  }
  .shadow-card-hover {
    box-shadow:
      0 2px 4px oklch(0.55 0.10 270 / 0.06),
      0 8px 24px oklch(0.55 0.10 270 / 0.10);
  }
  .shadow-elevated {
    box-shadow:
      0 4px 8px oklch(0.55 0.10 270 / 0.08),
      0 16px 48px oklch(0.55 0.10 270 / 0.12);
  }
}
```

**Step 4: Verify**

Run: `npx next build`
Expected: Builds successfully

**Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: update color palette to electric indigo/cyan/violet with custom shadows"
```

---

## Task 4: Create Top Navigation Component

**Files:**
- Create: `src/components/layout/top-nav.tsx`

**Step 1: Create the top navigation component**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Waves, LayoutDashboard, PlusCircle, Wand2, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects/new', label: 'New Project', icon: PlusCircle },
  { href: '/skills', label: 'Shared Skills', icon: Wand2 },
  { href: '/memories', label: 'Shared Memories', icon: Brain },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14">
      <div className="flex h-full items-center justify-between px-6 backdrop-blur-xl bg-background/80">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex size-8 items-center justify-center rounded-lg gradient-primary">
            <Waves className="size-4 text-white" />
          </div>
          <span className="font-heading text-base font-bold tracking-tight">
            Orcas Designer
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right slot (future: theme toggle, settings) */}
        <div className="w-8 shrink-0" />
      </div>

      {/* Gradient bottom border */}
      <div className="h-px gradient-border" />
    </header>
  );
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/layout/top-nav.tsx
git commit -m "feat: create top navigation component with frosted glass effect"
```

---

## Task 5: Update Root Layout — Remove Sidebar, Add Top Nav

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Replace AppSidebar with TopNav and update layout structure**

Replace the full layout.tsx content. Key changes:
- Import `TopNav` instead of `AppSidebar`
- Remove flex sidebar layout, add `pt-14` for fixed top nav offset
- Remove `pl-60` from main
- Structure: `TopNav` (fixed) + `main` (scrollable, padded top)

```tsx
import type { Metadata } from "next"
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { TopNav } from "@/components/layout/top-nav"

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
})

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Orcas Designer",
  description: "Visual prompt-chain designer for building AI agent skills",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <TooltipProvider>
          <TopNav />
          <main className="min-h-screen pt-14">{children}</main>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
```

**Step 2: Verify the app still builds**

Run: `npx next build`
Expected: Builds successfully. The sidebar is now replaced. Pages should render under the top nav.

**Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: replace sidebar layout with top navigation"
```

---

## Task 6: Update Header Component

**Files:**
- Modify: `src/components/layout/header.tsx`

**Step 1: Update header with new typography and spacing**

```tsx
import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function Header({ title, description, action, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-6 py-6",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
```

Key changes: remove `border-b`, use `font-heading`, bump to `text-xl font-bold`, increase padding to `py-6`, increase gap to `gap-1`.

**Step 2: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: update header with new typography, remove bottom border"
```

---

## Task 7: Update Page Container

**Files:**
- Modify: `src/components/layout/page-container.tsx`

**Step 1: Bump max-width and add wide variant**

```tsx
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  wide?: boolean
}

export function PageContainer({ children, className, wide = false }: PageContainerProps) {
  return (
    <div className={cn(
      "mx-auto px-6 pb-12",
      wide ? "max-w-6xl" : "max-w-5xl",
      className
    )}>
      {children}
    </div>
  )
}
```

Key changes: remove top padding (header handles it), add `pb-12` bottom breathing room, add `wide` prop for wizard.

**Step 2: Commit**

```bash
git add src/components/layout/page-container.tsx
git commit -m "feat: update page container with wide variant"
```

---

## Task 8: Update Card Component — Shadows + Rounded-2xl

**Files:**
- Modify: `src/components/ui/card.tsx`

**Step 1: Replace ring border with shadow system, update radius**

In the `Card` component className, replace:
- `rounded-xl` → `rounded-2xl`
- `ring-1 ring-foreground/10` → `shadow-card`
- Add: `transition-shadow duration-200`

The full className string becomes:
```
"group/card flex flex-col gap-4 overflow-hidden rounded-2xl bg-card py-4 text-sm text-card-foreground shadow-card transition-shadow duration-200 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-2xl *:[img:last-child]:rounded-b-2xl"
```

Also update CardHeader and CardFooter rounded classes from `xl` to `2xl`.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: update cards with shadow system and rounded-2xl"
```

---

## Task 9: Update Button Component — Gradient Primary + Press State

**Files:**
- Modify: `src/components/ui/button.tsx`

**Step 1: Update button variants**

In the `buttonVariants` cva config:

Update the base classes — add `active:scale-[0.97]` for press feedback:
```
"group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none active:scale-[0.97] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 ..."
```

Update the `default` variant to use gradient:
```
default: "gradient-primary text-white hover:opacity-90 [a]:hover:opacity-90",
```

Update the `ghost` variant hover to use primary color:
```
ghost: "hover:bg-primary/5 hover:text-primary aria-expanded:bg-primary/5 aria-expanded:text-primary dark:hover:bg-primary/10",
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: update buttons with gradient primary and press animation"
```

---

## Task 10: Update Badge Component — Category Color Variants

**Files:**
- Modify: `src/components/ui/badge.tsx`

**Step 1: Add category-specific color variants**

Add these new variants to the badge cva config:

```tsx
design: "border-transparent bg-violet/10 text-violet",
superpowers: "border-transparent bg-indigo/10 text-indigo",
figma: "border-transparent bg-cyan/10 text-cyan",
atlassian: "border-transparent bg-chart-4/10 text-chart-4",
"claude-management": "border-transparent bg-teal/10 text-teal",
meta: "border-transparent bg-amber/10 text-amber",
```

Note: These reference the custom color tokens defined in globals.css. They map to skill categories from `SKILL_CATEGORIES`.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat: add category color variants to badge component"
```

---

## Task 11: Update Input + Textarea — Taller, Indigo Focus

**Files:**
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`

**Step 1: Update Input**

Change the Input className:
- `h-8` → `h-9`
- `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` → `focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20`
- Add `placeholder:italic` after `placeholder:text-muted-foreground`

**Step 2: Update Textarea**

Same focus changes as Input:
- `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` → `focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20`
- Add `placeholder:italic`

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/ui/input.tsx src/components/ui/textarea.tsx
git commit -m "feat: update inputs with taller height, indigo focus, italic placeholder"
```

---

## Task 12: Update Dialog Component — Rounded-2xl + Stronger Backdrop

**Files:**
- Modify: `src/components/ui/dialog.tsx`

**Step 1: Update DialogOverlay**

Change `bg-black/10 backdrop-blur-xs` → `bg-black/25 backdrop-blur-sm`

**Step 2: Update DialogContent**

- Change `rounded-xl` → `rounded-2xl`
- Change `ring-1 ring-foreground/10` → `shadow-elevated`
- Add a gradient top accent: after the content div, add a pseudo-element or a separate `<div className="absolute inset-x-0 top-0 h-px gradient-border rounded-t-2xl" />` inside DialogContent.

**Step 3: Verify**

Run: `npx next build`
Expected: Builds successfully

**Step 4: Commit**

```bash
git add src/components/ui/dialog.tsx
git commit -m "feat: update dialogs with stronger backdrop and gradient accent"
```

---

## Task 13: Update Tabs Component — Pill Style Active State

**Files:**
- Modify: `src/components/ui/tabs.tsx`

**Step 1: Update TabsTrigger styling**

For the default variant active state, replace the subtle bg-background with a primary-filled pill:
- Active (data-[selected]): `bg-primary text-primary-foreground shadow-sm`
- Inactive: `text-muted-foreground hover:text-foreground hover:bg-muted`

This gives the "pill tabs" feel from the design.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ui/tabs.tsx
git commit -m "feat: update tabs with pill-style active state"
```

---

## Task 14: Create Motion Wrapper Component

**Files:**
- Create: `src/components/ui/motion.tsx`

**Step 1: Create reusable motion components**

```tsx
'use client';

import { motion, AnimatePresence } from 'motion/react';

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.05,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideTransition({
  children,
  id,
  direction = 1,
}: {
  children: React.ReactNode;
  id: string | number;
  direction?: 1 | -1;
}) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={id}
        custom={direction}
        initial={(d: number) => ({ opacity: 0, y: d * 20 })}
        animate={{ opacity: 1, y: 0 }}
        exit={(d: number) => ({ opacity: 0, y: d * -20 })}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export { motion, AnimatePresence };
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ui/motion.tsx
git commit -m "feat: create reusable motion wrapper components"
```

---

## Task 15: Redesign Empty State

**Files:**
- Modify: `src/components/dashboard/empty-state.tsx`

**Step 1: Rewrite with gradient accents and animation**

```tsx
'use client';

import { PlusCircle, Palette } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/motion';
import Link from 'next/link';

export function EmptyState() {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full gradient-primary opacity-20 blur-xl" />
        <div className="relative rounded-full gradient-primary p-5">
          <Palette className="size-8 text-white" />
        </div>
      </div>
      <h3 className="font-heading text-xl font-bold mb-2">No projects yet</h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        Create your first project to start generating design & development prompts for Claude Code.
      </p>
      <Link
        href="/projects/new"
        className={buttonVariants({ size: 'lg', className: 'gradient-primary text-white border-0 hover:opacity-90' })}
      >
        <PlusCircle />
        Create New Project
      </Link>
    </FadeIn>
  );
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/dashboard/empty-state.tsx
git commit -m "feat: redesign empty state with gradient accent and animation"
```

---

## Task 16: Redesign Project Card — Progress Ring + Status Chips

**Files:**
- Modify: `src/components/dashboard/project-card.tsx`

**Step 1: Rewrite project card with rich layout**

Key changes:
- Add status indicator chips (Figma link, output type, skills count, memories count)
- Replace linear progress bar with SVG circular progress ring (indigo→cyan gradient)
- Add hover lift animation
- Use `font-heading` for project name
- Show relative time ("2 hours ago") instead of formatted date
- Keep Open and Delete actions

Import helpers: add a `getRelativeTime` helper function at top of file. Use `Intl.RelativeTimeFormat` or simple logic.

Add status chip rendering: check project fields for Figma link presence, output type, custom+shared skill count, memory count.

SVG progress ring: a 36px circle with `stroke-dasharray` and `stroke-dashoffset` for the fill amount, using a gradient `<linearGradient>` definition for the indigo→cyan stroke.

Add `hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200` to the Card.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/dashboard/project-card.tsx
git commit -m "feat: redesign project cards with progress ring and status chips"
```

---

## Task 17: Update Project List — Staggered Animation

**Files:**
- Modify: `src/components/dashboard/project-list.tsx`

**Step 1: Wrap grid in StaggerContainer, each card in StaggerItem**

Read the current file, then wrap the grid in `<StaggerContainer>` and each `<ProjectCard>` in a `<StaggerItem>`. Import from `@/components/ui/motion`.

Keep the existing grid classes: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/dashboard/project-list.tsx
git commit -m "feat: add staggered animation to project list"
```

---

## Task 18: Redesign Wizard — Vertical Stepper Layout

This is the largest task. The wizard-shell gets a full rewrite.

**Files:**
- Modify: `src/components/wizard/wizard-shell.tsx`
- Modify: `src/app/projects/new/page.tsx`

**Step 1: Rewrite wizard-shell.tsx with two-panel stepper layout**

Key structure:
```tsx
<div className="flex gap-8">
  {/* Left: Stepper Panel (280px, sticky) */}
  <aside className="w-70 shrink-0 sticky top-20 self-start">
    {/* Vertical progress line */}
    {/* Step groups: Context (0-3), Design Assets (4-8), Configuration (9-12) */}
    {/* Each step: clickable row with number circle + label + status */}
  </aside>

  {/* Right: Step Content (flexible) */}
  <div className="flex-1 min-w-0">
    {/* Step content with animation */}
    {/* Navigation buttons at bottom */}
  </div>
</div>
```

Step grouping logic:
```tsx
const STEP_GROUPS = [
  { label: 'Context', range: [0, 3] },
  { label: 'Design Assets', range: [4, 8] },
  { label: 'Configuration', range: [9, 12] },
] as const;
```

Step status rendering:
- Active: `bg-primary text-primary-foreground` circle, bold label
- Completed (canProceed for that step or has data): `bg-accent text-accent-foreground` with Check icon
- Upcoming: `bg-muted text-muted-foreground` with step number
- Required steps get a small asterisk indicator

Use `AnimatePresence` + `motion.div` for step content transitions (slide up/down based on direction).

Props change: add `completedSteps?: Set<number>` or derive from form state. Keep existing props and add what's needed.

**Step 2: Update new project page to use wide container and pass direction**

In `src/app/projects/new/page.tsx`:
- Use `<PageContainer wide>` wrapper
- Track step direction (forward/back) for animation
- Move project name input into the stepper's top area or keep above

**Step 3: Verify**

Run: `npx next build`
Expected: Builds successfully

**Step 4: Commit**

```bash
git add src/components/wizard/wizard-shell.tsx src/app/projects/new/page.tsx
git commit -m "feat: redesign wizard with vertical stepper panel and step transitions"
```

---

## Task 19: Update File Upload — Gradient Borders

**Files:**
- Modify: `src/components/fields/file-upload.tsx`

**Step 1: Update drag-drop zone styling**

Replace the current dashed border styling:
- Default: `border-2 border-dashed border-border` (keep)
- Hover: add `hover:border-primary/40`
- Drag-over: `border-primary bg-primary/5` (replace current)
- Add animated icon: use `motion.div` for a subtle bounce on the upload icon during drag-over

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/fields/file-upload.tsx
git commit -m "feat: update file upload with gradient borders and drag animation"
```

---

## Task 20: Update Dashboard Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Update the page with FadeIn animation**

Wrap the header area with `<FadeIn>`. The `<ProjectList>` already handles its own stagger. Update the "New Project" link button to use the gradient style:

```tsx
<Link
  href="/projects/new"
  className={buttonVariants({ className: 'gradient-primary text-white border-0 hover:opacity-90' })}
>
  <PlusCircle />
  New Project
</Link>
```

**Step 2: Verify**

Run: `npx next build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: update dashboard page with animations and gradient CTA"
```

---

## Task 21: Update Skills Page

**Files:**
- Modify: `src/app/skills/page.tsx`

**Step 1: Add FadeIn wrapper**

Wrap the content in `<FadeIn>`. The built-in skills section and shared skills already look decent from the earlier work. The new color palette will automatically apply.

**Step 2: Commit**

```bash
git add src/app/skills/page.tsx
git commit -m "feat: add entrance animation to skills page"
```

---

## Task 22: Update Memories Page

**Files:**
- Modify: `src/app/memories/page.tsx`

**Step 1: Add FadeIn wrapper**

Same pattern as skills page.

**Step 2: Commit**

```bash
git add src/app/memories/page.tsx
git commit -m "feat: add entrance animation to memories page"
```

---

## Task 23: Update Project Detail Page

**Files:**
- Modify: `src/app/projects/[id]/page.tsx`

**Step 1: Add FadeIn animation and update styling**

Wrap the main content area with `<FadeIn>`. The tab navigation will already benefit from the pill-style tabs update.

**Step 2: Commit**

```bash
git add src/app/projects/[id]/page.tsx
git commit -m "feat: add entrance animation to project detail page"
```

---

## Task 24: Clean Up Sidebar File

**Files:**
- Delete or deprecate: `src/components/layout/app-sidebar.tsx`

**Step 1: Remove the old sidebar component**

Since the root layout no longer imports it, delete the file:

Run: `rm src/components/layout/app-sidebar.tsx`

**Step 2: Verify no remaining imports**

Run: `grep -r "app-sidebar" src/`
Expected: No matches (layout.tsx was already updated)

Run: `npx next build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old sidebar component"
```

---

## Task 25: Final Build Verification + Visual QA

**Step 1: Full build check**

Run: `npx tsc --noEmit && npx next build`
Expected: Both pass with no errors

**Step 2: Visual verification checklist**

Start dev server: `npm run dev`

Verify each page:
- [ ] Top nav renders with frosted glass, gradient border, pill-style active links
- [ ] Dashboard: cards have shadows, progress rings, status chips, stagger animation
- [ ] Dashboard: empty state has gradient icon with animation
- [ ] New Project: vertical stepper on left, step content on right, step transitions
- [ ] New Project: stepper shows groups (Context, Design Assets, Configuration)
- [ ] New Project: clicking steps in stepper navigates correctly
- [ ] Skills: page renders with FadeIn, built-in + custom skills visible
- [ ] Memories: page renders with FadeIn, view dialog works
- [ ] Project Detail: tabs render with pill style, prompt preview works
- [ ] All dialogs: rounded-2xl, stronger backdrop, gradient top accent
- [ ] Buttons: primary has gradient, press state scales down
- [ ] Inputs: taller, indigo focus ring, italic placeholder
- [ ] Typography: Plus Jakarta Sans on headings, DM Sans on body

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete UI/UX redesign - creative tool aesthetic"
```
