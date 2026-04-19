# UX Research Built-in Skills & Memories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the 15 research methods as user-pickable built-in **skills** (category `UX Research`), add 2 Boomi docs (UXR Operations Guide, UX Research Process) as built-in **memories** (same category, tagged `Boomi Knowledge`), backfill categories/tags on existing built-in memories, implement the auto-lock flow from Researcher Method Selection → Skills & Memories step, and upgrade the Researcher Edge Function to Claude Opus 4.7 with max extended thinking.

**Architecture:** New `BuiltInSkill` type lives in `src/lib/built-in-skills.ts` (code, not DB) alongside the existing `MANDATORY_SKILLS` array. A new `skill-resolver.ts` utility discriminates built-in vs DB skills by ID. `shared_memories` gains `category` + `tags` columns. The Researcher Edge Function's `loadSkillsContent` uses a duplicated built-in skills map (same pattern already used for `BUILT_IN_RESEARCH_METHODS`) and resolves IDs to inline content. Cross-app refactors (Prompt Generator) are out of scope.

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Supabase (PostgreSQL + RLS) + Vitest + jsdom + @testing-library/react + Deno (Supabase Edge Functions) + `@anthropic-ai/sdk`.

**Spec reference:** `docs/superpowers/specs/2026-04-19-ux-research-builtins-design.md`

**Source material:**
- `.claude/source-docs/boomi-uxr-operations-guide-raw.md` (raw source for UXR Ops Guide memory)
- `.claude/source-docs/boomi-ux-research-process-raw.md` (raw source for UX Research Process memory)

**Testing strategy:** TDD — each non-trivial behavior has a failing test written first. Vitest covers `src/lib/**` and `src/hooks/**` (pure logic). UI changes are tested via extracted pure helpers (category grouping, tag filtering) where feasible; component rendering itself is verified by manual QA (consistent with existing codebase convention).

---

## File Map

**Create:**
- `src/lib/built-in-skills.ts` — exports `BUILT_IN_SKILLS: BuiltInSkill[]` and helpers
- `src/lib/built-in-skills.test.ts`
- `src/lib/skill-resolver.ts` — resolver utility
- `src/lib/skill-resolver.test.ts`
- `src/lib/category-grouping.ts` — pure grouping helpers (testable)
- `src/lib/category-grouping.test.ts`
- `src/components/ui/tag-badge.tsx` — `<TagBadge>` component
- `supabase/migrations/20260419000000_shared_memories_category_tags.sql`

**Modify:**
- `src/lib/types.ts` — extend `SharedMemory` with `category`, `tags`
- `src/lib/supabase-types.ts` — extend `shared_memories` table types
- `src/lib/constants.ts` — add 2 new memory content constants + their memory ID exports
- `src/hooks/use-shared-memories.ts` — seed new memories, pass category/tags to RPC
- `src/hooks/use-shared-memories.test.ts` — extend for category/tags
- `src/hooks/use-researcher-form.ts` — reducer prunes skill IDs when methods are unselected
- `src/hooks/use-researcher-form.test.ts` — assert prune behavior
- `src/components/memories/memory-card.tsx` — render tag badges
- `src/components/memories/shared-memory-manager.tsx` — category grouping
- `src/components/memories/shared-memories-picker.tsx` — optional `categoryFilter` (used by Researcher)
- `src/components/skills/skill-card.tsx` — handle `BuiltInSkill` discriminator + render tags
- `src/components/skills/shared-skill-manager.tsx` — merge MANDATORY_SKILLS + BUILT_IN_SKILLS, category-grouped
- `src/components/skills/shared-skills-picker.tsx` — accept `lockedIds` + `builtInSkills` props
- `src/components/researcher/wizard/step-skills-memories.tsx` — accept + pass `lockedSkillIds`
- `src/app/researcher/new/page.tsx` (or equivalent wizard shell) — derive `lockedSkillIds` from `selectedMethodIds`
- `supabase/functions/researcher-execute/index.ts` — integrate built-in skill resolver + model upgrade (Opus 4.7 max extended on both method calls + synthesis)

---

## Phase 1 — Types & Schema Foundation

### Task 1: DB migration — add `category` + `tags` to `shared_memories`

**Files:**
- Create: `supabase/migrations/20260419000000_shared_memories_category_tags.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Add category and tags columns to shared_memories for grouping/tagging
ALTER TABLE shared_memories
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Optional lightweight index for category-based filtering
CREATE INDEX IF NOT EXISTS shared_memories_category_idx
  ON shared_memories (category)
  WHERE category IS NOT NULL;
```

- [ ] **Step 2: Apply locally**

Run: `supabase db reset` (or `supabase migration up` if you don't want to wipe data)
Expected: Migration applies cleanly, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260419000000_shared_memories_category_tags.sql
git commit -m "feat(db): add category and tags columns to shared_memories"
```

---

### Task 2: Update `upsert_built_in_memory` RPC signature

**Files:**
- Create: `supabase/migrations/20260419000001_upsert_built_in_memory_category_tags.sql`

The existing RPC is defined in an earlier migration. Search for it before editing to get the exact current signature.

- [ ] **Step 1: Find current RPC definition**

Run: `rg "upsert_built_in_memory" supabase/migrations/`
Expected: One or more `.sql` files containing `CREATE OR REPLACE FUNCTION upsert_built_in_memory(...)`. Read the latest one to copy its body as a starting point.

- [ ] **Step 2: Write the migration**

```sql
-- Extend upsert_built_in_memory to accept category + tags
-- (Reads existing body from prior migration; adds p_category and p_tags params.)

CREATE OR REPLACE FUNCTION upsert_built_in_memory(
  p_id TEXT,
  p_name TEXT,
  p_description TEXT,
  p_content TEXT,
  p_file_name TEXT,
  p_category TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO shared_memories (id, name, description, content, file_name, is_built_in, category, tags)
  VALUES (p_id, p_name, p_description, p_content, p_file_name, TRUE, p_category, p_tags)
  ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    content     = EXCLUDED.content,
    file_name   = EXCLUDED.file_name,
    is_built_in = TRUE,
    category    = EXCLUDED.category,
    tags        = EXCLUDED.tags,
    updated_at  = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_built_in_memory(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]) TO authenticated;
```

- [ ] **Step 3: Apply**

Run: `supabase migration up`
Expected: Function is replaced successfully. Old 5-arg callers continue working (new args have defaults).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260419000001_upsert_built_in_memory_category_tags.sql
git commit -m "feat(db): extend upsert_built_in_memory with category and tags params"
```

---

### Task 3: Update `supabase-types.ts` for new columns

**Files:**
- Modify: `src/lib/supabase-types.ts`

- [ ] **Step 1: Locate `shared_memories` Row / Insert / Update types**

Run: `rg -n "shared_memories:" src/lib/supabase-types.ts`
Expected: Shows the table type definition with `Row`, `Insert`, `Update` generics.

- [ ] **Step 2: Add fields to all three**

Inside `shared_memories.Row`:
```ts
category: string | null;
tags: string[];
```

Inside `shared_memories.Insert` and `Update`:
```ts
category?: string | null;
tags?: string[];
```

Also extend the `upsert_built_in_memory` function signature under the `Functions` key to include `p_category?: string; p_tags?: string[]`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: No new type errors (may surface downstream errors we fix in later tasks — that's OK, just note them).

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase-types.ts
git commit -m "feat(types): add category and tags to shared_memories types"
```

---

### Task 4: Extend `SharedMemory` domain type

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Update the interface**

Find `export interface SharedMemory` (around line 60) and add:

```ts
export interface SharedMemory {
  id: MemoryId;
  name: string;
  description: string;
  content: string;
  fileName: string;
  isBuiltIn: boolean;
  category: string | null;   // NEW
  tags: string[];            // NEW
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Update `toSharedMemory` mapper in `src/hooks/use-shared-memories.ts`**

```ts
export function toSharedMemory(row: Record<string, unknown>): SharedMemory {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    content: row.content as string,
    fileName: row.file_name as string,
    isBuiltIn: row.is_built_in as boolean,
    category: (row.category as string | null) ?? null,   // NEW
    tags: (row.tags as string[] | null) ?? [],           // NEW
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: Type errors may appear in components that spread `SharedMemory` — document them for later tasks.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/hooks/use-shared-memories.ts
git commit -m "feat(types): extend SharedMemory with category and tags"
```

---

## Phase 2 — `BuiltInSkill` Type & Data

### Task 5: Define `BuiltInSkill` type and seed 15 research methods

**Files:**
- Create: `src/lib/built-in-skills.ts`
- Test: `src/lib/built-in-skills.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/built-in-skills.test.ts
import { describe, it, expect } from 'vitest';
import { BUILT_IN_SKILLS, getBuiltInSkillById } from './built-in-skills';
import { BUILT_IN_RESEARCH_METHODS } from './researcher-constants';

describe('BUILT_IN_SKILLS', () => {
  it('exports 15 research method skills', () => {
    expect(BUILT_IN_SKILLS).toHaveLength(15);
  });

  it('every skill has the required shape', () => {
    for (const skill of BUILT_IN_SKILLS) {
      expect(skill.id).toMatch(/^[a-z0-9-]+$/);
      expect(skill.name).toBeTruthy();
      expect(skill.category).toBe('UX Research');
      expect(Array.isArray(skill.tags)).toBe(true);
      expect(skill.description).toBeTruthy();
      expect(skill.content).toBeTruthy();
      expect(skill.content.length).toBeGreaterThan(200);
    }
  });

  it('skill IDs exactly match researcher-constants method IDs', () => {
    const skillIds = BUILT_IN_SKILLS.map(s => s.id).sort();
    const methodIds = BUILT_IN_RESEARCH_METHODS.map(m => m.id).sort();
    expect(skillIds).toEqual(methodIds);
  });

  it('has no duplicate IDs', () => {
    const ids = BUILT_IN_SKILLS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no skill is tagged Boomi Knowledge (methods synthesized from general UXR)', () => {
    for (const skill of BUILT_IN_SKILLS) {
      expect(skill.tags).not.toContain('Boomi Knowledge');
    }
  });

  it('getBuiltInSkillById returns the skill when found', () => {
    const skill = getBuiltInSkillById('heuristic-evaluation');
    expect(skill?.name).toBe('Heuristic Evaluation');
  });

  it('getBuiltInSkillById returns null for unknown IDs', () => {
    expect(getBuiltInSkillById('does-not-exist')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/built-in-skills.test.ts`
Expected: FAIL — `built-in-skills.ts` does not exist.

- [ ] **Step 3: Create `src/lib/built-in-skills.ts`**

```ts
import type { BuiltInResearchMethod } from './researcher-types';
import { BUILT_IN_RESEARCH_METHODS } from './researcher-constants';

export interface BuiltInSkill {
  id: string;
  name: string;
  category: string;
  tags: string[];
  description: string;
  content: string;          // markdown methodology prose
  icon?: string;            // lucide icon name
}

// Framework guidance per method — same text used by the Researcher Edge Function's getFrameworkGuidance.
// Kept in sync with supabase/functions/researcher-execute/index.ts (see parity test).
const FRAMEWORK_GUIDANCE: Record<string, string> = {
  'heuristic-evaluation': `Apply Jakob Nielsen's 10 Usability Heuristics:
1. Visibility of system status
2. Match between system and the real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

Rate each violation: Cosmetic (0), Minor (1), Major (2), Catastrophic (3).
Include the specific heuristic violated, the location in the UI, and a concrete recommendation.`,

  'cognitive-walkthrough': `For each task step, evaluate these four questions:
1. Will users try to achieve the right effect? (Goal formation)
2. Will users notice the correct action is available? (Action visibility)
3. Will users associate the correct action with the desired effect? (Action-effect mapping)
4. Will users understand the feedback after the action? (Feedback interpretation)

Mark each step as PASS or FAIL per question. Identify confusion points and provide specific remediation.`,

  'accessibility-audit': `Evaluate against WCAG 2.1 AA guidelines across these categories:
- Perceivable: Text alternatives, adaptable content, distinguishable elements
- Operable: Keyboard accessible, sufficient time, no seizure-inducing content, navigable
- Understandable: Readable, predictable, input assistance
- Robust: Compatible with assistive technologies

Rate issues by conformance level (A, AA, AAA) and impact severity.`,

  'ia-review': `Evaluate Information Architecture across:
- Organization schemes: How content is categorized and grouped
- Labeling systems: Terminology clarity and consistency
- Navigation systems: Wayfinding and movement between sections
- Search systems: Findability of content
- Mental model alignment: Does the structure match user expectations?

Use card sorting principles to suggest restructuring where needed.`,

  'usability-test-plan': `Create a complete test plan including:
- Study objectives and research questions
- Participant screener with inclusion/exclusion criteria
- Task scenarios (5-8 tasks with success criteria)
- Metrics: task completion rate, time on task, error rate, SUS score
- Moderator guide with probing questions
- Pre/post-test questionnaires
- Analysis framework and reporting template`,

  'ux-metrics-framework': `Define metrics using the HEART framework (Happiness, Engagement, Adoption, Retention, Task success) plus:
- Behavioral metrics: What users do (click-through rates, task completion, error rates)
- Attitudinal metrics: What users feel (NPS, SUS, CSAT)
- Custom metrics: Product-specific KPIs
- Measurement methodology: How to collect each metric
- Benchmarks: Industry standards and targets
- Dashboard structure: How to visualize and track over time`,

  'persona-development': `Create 3-5 distinct user personas, each including:
- Name, role, and demographic snapshot
- Goals and motivations (primary and secondary)
- Pain points and frustrations
- Behaviors and habits (technology usage patterns)
- A day-in-the-life scenario
- A representative quote
- Key needs from the product

Base personas on the target audience data provided. Make them specific and realistic, not generic archetypes.`,

  'user-journey-mapping': `Map the journey across these stages:
- Awareness: How users discover the product/feature
- Consideration: Evaluation and comparison
- Onboarding: First-time setup and learning
- Usage: Core task completion
- Retention: Ongoing engagement and habit formation
- Advocacy: Sharing and recommending

For each stage, document: user actions, thoughts, emotions (positive/negative), pain points, opportunities, and touchpoints.`,

  'competitive-ux-analysis': `Analyze competitors across these dimensions:
- Feature parity matrix: What exists vs. what's missing
- Interaction patterns: How key tasks are accomplished
- Information architecture: Navigation and content organization
- Visual design and branding: Look, feel, and consistency
- Onboarding experience: First-run and learning curve
- Unique differentiators: What each competitor does uniquely well

Conclude with strategic recommendations for differentiation.`,

  'task-analysis': `Use Hierarchical Task Analysis (HTA) to decompose tasks:
- Identify top-level user goals
- Break each goal into subtasks (2-4 levels deep)
- Document decision points and branching paths
- Measure complexity (number of steps, cognitive load)
- Identify friction points: unnecessary steps, confusing decisions, dead ends
- Recommend optimizations with estimated step reduction`,

  'research-plan': `Create a comprehensive research plan including:
- Research objectives and key questions
- Methods selection with justification for each
- Participant criteria (demographics, experience level, recruitment)
- Timeline with milestones (typically 4-8 weeks)
- Resource requirements (tools, budget, personnel)
- Activity sequence and dependencies
- Risk mitigation strategies
- Deliverables and reporting schedule`,

  'activity-protocol': `Create a detailed session protocol including:
- Introduction script (consent, recording, ground rules)
- Warm-up questions (5 min)
- Core task scenarios with probing questions
- Think-aloud instructions
- Follow-up and clarification prompts
- Debrief questions
- Note-taking template for observers
- Estimated timing per section`,

  'survey-analysis': `Analyze the provided survey data:
- Quantitative analysis: Response distributions, cross-tabulations, correlations
- Qualitative analysis: Thematic coding of open-ended responses
- Sentiment analysis: Overall and per-question sentiment
- Key findings: Top insights ranked by significance
- Segment analysis: Differences across user segments
- Recommended follow-up: Questions for deeper investigation`,

  'interview-analysis': `Analyze the provided interview/session data:
- Affinity mapping: Group related observations into themes
- Theme frequency: How often each theme appears across sessions
- Key quotes: Representative verbatim quotes per theme
- Pattern analysis: Behavioral patterns and mental models
- Persona refinements: How findings update existing personas
- Actionable recommendations: Prioritized by impact and frequency`,

  'content-audit': `Audit the provided content across:
- Quality: Accuracy, clarity, completeness, currency
- Consistency: Tone, terminology, formatting, structure
- Readability: Grade level, sentence complexity, jargon usage
- Gaps: Missing content, underserved user needs
- Redundancy: Duplicate or overlapping content
- Prioritized recommendations: What to fix, consolidate, or create`,
};

function buildContent(method: BuiltInResearchMethod): string {
  const guidance = FRAMEWORK_GUIDANCE[method.id]
    ?? 'Follow established UX research best practices for this method.';

  return `# ${method.name}

## Purpose
${method.description}

## Framework & Approach
${guidance}

## Expected Output
${method.outputFormat}

## Instructions
When invoked, produce a well-structured markdown document that follows the framework above. Use clear headings (##, ###), include specific and actionable findings, rate severity or priority where applicable, and tie recommendations back to the research context provided by the researcher.`;
}

export const BUILT_IN_SKILLS: BuiltInSkill[] = BUILT_IN_RESEARCH_METHODS.map((method) => ({
  id: method.id,
  name: method.name,
  category: 'UX Research',
  tags: [],
  description: method.description,
  content: buildContent(method),
  icon: method.icon,
}));

export function getBuiltInSkillById(id: string): BuiltInSkill | null {
  return BUILT_IN_SKILLS.find((s) => s.id === id) ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/built-in-skills.test.ts`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/built-in-skills.ts src/lib/built-in-skills.test.ts
git commit -m "feat(skills): add BuiltInSkill type and 15 UX Research methods"
```

---

## Phase 3 — Skill Resolver

### Task 6: Skill resolver utility

**Files:**
- Create: `src/lib/skill-resolver.ts`
- Test: `src/lib/skill-resolver.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/skill-resolver.test.ts
import { describe, it, expect } from 'vitest';
import { resolveSkill } from './skill-resolver';
import type { SharedSkill } from './types';

const dbSkill: SharedSkill = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Custom Skill',
  description: 'Custom',
  type: 'url',
  urlValue: 'https://example.com',
  fileContent: null,
  createdAt: '',
  updatedAt: '',
};

describe('resolveSkill', () => {
  it('returns a builtin resolution when ID matches BUILT_IN_SKILLS', () => {
    const r = resolveSkill('heuristic-evaluation', []);
    expect(r?.kind).toBe('builtin');
    if (r?.kind === 'builtin') {
      expect(r.skill.name).toBe('Heuristic Evaluation');
      expect(r.skill.content).toContain("Nielsen's 10 Usability Heuristics");
    }
  });

  it('returns a db resolution when ID matches a provided DB skill', () => {
    const r = resolveSkill(dbSkill.id, [dbSkill]);
    expect(r?.kind).toBe('db');
    if (r?.kind === 'db') {
      expect(r.skill.id).toBe(dbSkill.id);
    }
  });

  it('returns null when ID is not found anywhere', () => {
    expect(resolveSkill('unknown-id', [dbSkill])).toBeNull();
  });

  it('prefers built-in when an ID coincidentally matches both', () => {
    const faux: SharedSkill = { ...dbSkill, id: 'heuristic-evaluation' };
    const r = resolveSkill('heuristic-evaluation', [faux]);
    expect(r?.kind).toBe('builtin');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/skill-resolver.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/skill-resolver.ts
import type { SharedSkill } from './types';
import { type BuiltInSkill, getBuiltInSkillById } from './built-in-skills';

export type ResolvedSkill =
  | { kind: 'builtin'; skill: BuiltInSkill }
  | { kind: 'db'; skill: SharedSkill };

export function resolveSkill(id: string, dbSkills: SharedSkill[]): ResolvedSkill | null {
  const builtIn = getBuiltInSkillById(id);
  if (builtIn) return { kind: 'builtin', skill: builtIn };

  const db = dbSkills.find((s) => s.id === id);
  if (db) return { kind: 'db', skill: db };

  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/skill-resolver.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/skill-resolver.ts src/lib/skill-resolver.test.ts
git commit -m "feat(skills): add resolveSkill discriminating builtin vs db skills"
```

---

## Phase 4 — New Built-in Memory Content

### Task 7: Draft trimmed UXR Operations Guide content constant

**Files:**
- Modify: `src/lib/constants.ts`

The trimmed content should capture: process overview, framing, collaboration principle, raw data handling policy, incentive *principles* (not procedures), participant identification rationale (customer / internal / partner / non-customer types), screener purpose, participant agreement rationale, dissemination principles, UX metrics note. Drop: tooling step-by-steps (Tremendous, Calendly, Gong, Salesforce download procedures, Mail Merge instructions, Slack auto-reply setup).

Source: `.claude/source-docs/boomi-uxr-operations-guide-raw.md`.

- [ ] **Step 1: Add the constant export**

Place just after `BUILT_IN_AI_VOICE_GUIDELINES` in `src/lib/constants.ts`:

```ts
export const BUILT_IN_UXR_OPERATIONS_GUIDE = `# Boomi UXR Operations Guide (Research-Focused Summary)

*Source: Boomi UX Research Operations Guide v0.1 (Oct 2022), trimmed to research-relevant sections. Operational tooling procedures (gift-card platforms, scheduling tools, CRM exports) are intentionally omitted.*

## UX Research Process Overview

Research flows through these phases: **Intake → Framing → Kickoff → Recruiting → Screening → Scheduling → Plan Activities → Conduct Activities → Analyze & Synthesize → Present → Document & Archive**. Intake captures the question or need; framing turns it into a shared document stakeholders align on; kickoff confirms roles and timeline; the recruit/screen/schedule phases produce qualified participants; activities are carefully scripted and executed; analysis and synthesis are where insights emerge; dissemination and archival close the loop.

## Framing

A framing document is the shared artifact that carries the project from start to finish. Stakeholders and champions refer to it throughout. At Boomi these live in Google Docs today.

## Collaboration

Stakeholders are included throughout the UX Research process — not just at kickoff and readout. Communication happens via Slack status, Slackbot auto-replies, and direct email when the researcher is traveling or out. Transparency about schedules and coverage is part of the team's operating norm.

## Where Work Lives

Research files and raw data recordings are kept on the UX team's Google Drive. The structure distinguishes project folders (feature-specific) from resource folders (general-purpose).

## Raw Data & Recordings

Internal and external participant transcripts and recordings contain Personally Identifiable Information (PII) — name, department, role, and sometimes customer account identifiers. Researchers have a duty to protect them.

- Raw data lives in the "UX Research PRIVATE" drive.
- Examples include Salesforce customer lists with PII and raw recordings of research sessions.
- Raw recordings are *not* widely shared. If a stakeholder requests access, the researcher first confirms the request does not violate the participant agreement form. When in doubt, consult teammates.

## Incentives (Policy, Not Procedure)

Incentive decisions are governed by Boomi's Global Gifts and Hospitality Policy (legal-approved). The operating principles:

- "Incentives" are anything of value, including SWAG and gift cards. Limits apply to the *total* of SWAG + gift cards.
- No cash gifts or cash cards (Visa, etc.).
- No more than \$100 per person per Boomi fiscal year without ELT + written Legal approval.
- No incentives to public-sector employees (healthcare, education, public officials, government-funded entities).
- No incentives to Boomi employees — customers and partners only.
- Track every incentive recipient in Salesforce; require work email addresses at sign-up.
- Only use platforms that allow tracking and documentation of who received what.

Sample incentive levels used historically:
- 1-hour moderated usability session: \$100
- 45-min moderated usability session: \$75
- 30-min moderated usability session: \$25-35
- 15-min unmoderated usability session: \$25
- 1-hour interview: \$50

Communication template for participants (legal-approved): *"Participants who register, schedule, and complete a session may receive an incentive valued at [\$XXX USD]. Participants are eligible for this incentive if they agree to Boomi's Terms of Use: Reward Redemption under the Tremendous platform."*

## Participants — Where to Find Them

Participants fall into four audience types, each with its own recruitment channels:

### Customers (Boomi users)
Primary source. Recruit via:
- Salesforce accounts + contacts
- Pendo (in-platform live intercepts and user lists)
- Customer Research Panel
- Boomi training registrations
- Referrals from Customer Success, Customer Support, Product Management, Engineering, Learning & Development, Business Operations

Enrich with Salesforce data, dedupe, drop internal @boomi.com emails, exclude opt-outs and red-flagged contacts before outreach.

### Partners
Reach through Partner Success leads for the relevant partner type (TPP / SI-GSI / OEM). Partner newsletters can include UX research announcements to targeted partner types.

### Internal Boomi users
Slack direct outreach with introduction, project description, and reason for engagement. Internal audiences include PSOs, Solutions team, Engineers (including pre-sales and Information Architects), Learning & Development, and Product Managers. Maintain a tracking list to avoid over-contacting the same colleagues.

### Non-Customer External Participants
When research calls for prospects or general users outside the Boomi ecosystem, use onboarded recruitment platforms (e.g., User Interviews) or CX-recommended channels. All such participants sign an NDA before sessions.

## Customer Success Coordination (as of Sep 2024)

- UX may reach out to customers directly without pre-approval from Customer Success.
- UX sends an FYI email to CS leadership per project so CS can pass it along internally.
- UX self-serves as much as possible from Salesforce and Pendo.
- UX only asks CS about specific humans not in Salesforce or with unclear Salesforce data.
- All product-data questions go to Product Management, not CS.

## Red Flags — Contacts to Exclude

Regardless of study, always exclude opt-outs. Study-specific exclusions commonly include:
- Inactive accounts, red-status accounts, Boomi Platform = FALSE
- Regions not prioritized for this study
- Consulting-firm or personal-email domains for consultant contacts
- Names or emails flagged "do not contact"
- Non-platform users
- Testing or automation contacts
- Executives at large firms, Legal, Procurement, Accounts Payable contacts

## Screening

Screener surveys sit inside the recruitment email body or as a follow-up link. They screen out participants who don't meet profile criteria and also let participants opt into future studies. At Boomi today these use Google Forms.

## Participant Agreement Form

For studies involving Boomi customers, participants complete a participant agreement form so they understand Boomi's gift policy and confirm their eligibility to accept an incentive. The link appears in the confirmation email, the calendar invite, and reminder emails; if still incomplete at session start, the researcher asks them to complete it then.

## Disseminating Findings

### UXR internal website
Completed projects are posted on the UX Research internal website (uxr.boomi.com) for organizational discoverability.

### Highlight videos
Snack-sized edited videos that communicate project findings. iMovie is the common tool.

### P&T Blog Posts
Share findings with the broader Product & Technology organization via short, readable blog posts. Focus on the story and one or two clear insights, not the full methodology. Good blog posts are accessible to readers outside the immediate team.

## UX Metrics

Refer to the internal Playbook: UX Metrics Program for the canonical metrics framework.

## Triaging Write-in Comments

When a write-in survey comment is not relevant to your product vertical, route it:
- **Customer Success** if the comment expresses a user's need for help, is extremely long or impassioned, or otherwise suggests an outreach. Find the account in Salesforce, identify the Success Account Owner, and email the CS rep with the comment and context.
- Other internal teams as appropriate, based on the substance of the comment.

---
*This memory is a research-process reference. For operational tooling procedures (gift-card sending, scheduling tools, CRM exports, Mail Merge), see the full Boomi UXR Operations Guide in Google Drive.*
`;

export const BUILT_IN_UXR_OPERATIONS_GUIDE_MEMORY_ID = 'built-in-uxr-operations-guide';
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat(memories): add Boomi UXR Operations Guide content constant"
```

---

### Task 8: Draft UX Research Process content constant

**Files:**
- Modify: `src/lib/constants.ts`

Source: `.claude/source-docs/boomi-ux-research-process-raw.md`. This doc is cleaner — include nearly all of it (drop only the internal-tool appendix references).

- [ ] **Step 1: Add the constant export**

Place just after `BUILT_IN_UXR_OPERATIONS_GUIDE`:

```ts
export const BUILT_IN_UX_RESEARCH_PROCESS = `# Boomi UX Research Process

*Source: Boomi UX Research Process v0.1 (Dec 2022).*

## What is UX Research

User Experience Research (UXR) is the process of understanding the motivations, mental models, and ultimately behavior of people as they experience a product or service. This process translates those understandings into actionable insights, implications, and recommendations for teams to leverage as they design or improve products, services, processes, or organizations. The UXR process is executed by highly-skilled practitioners who employ quantitative, qualitative, or a mixture of the two (mixed methods).

## Value of UX Research

The true value of UX Research is to understand the who, what, where, when, how, and why of people who engage with products and services. In particular, UX Researchers seek to understand the context — the why — of people's behavior.

UX Research reduces risk and costs across the product lifecycle. Before a line of code is written, UX Research can provide actionable insights and recommendations. Cost is reduced because the right thing is built the first time. Uncovering direct and latent needs means that when code is committed and the product is launched, the risk of building the wrong thing is reduced.

## Types of UX Research Projects

Projects fall into three general categories.

### Exploratory
Discover themes and patterns from observing people doing their work. Broader in nature and sometimes lead to insights the team would never uncover with more structured activities. The team often doesn't know what they will find out and will discover latent needs that other methods can't uncover. These projects tend to be longer because they use open-ended methods and the data is unstructured — longer to analyze. They are most informative for longer time horizons.

Methods often employed: (pseudo-)ethnographic observation, diary studies, contextual inquiry, structured and unstructured interviews, mixed-methods longitudinal studies.

### Generative
Leverage creative methods to generate more and varied concepts of an idea. Activities can be with internal stakeholders or external prospects/customers. Outputs are a mix of structured and unstructured data, so analysis must be careful and deliberate. Outputs of a creative workshop inform and inspire — they should not be executed exactly as described by participants.

Methods often employed: participatory design workshops, structured diary studies (workbooks), MakeTools (moderated and unmoderated), design thinking workshops, co-creative concept validation.

### Evaluative
Evaluate the usefulness, usability, or desirability of a product, service, or concept. Projects involve a design, concept, or service that is either live or concepted to the point that a participant doesn't have to make a substantial cognitive leap to envision using it. These are the most structured and straightforward to execute, though they can require specialized platforms. Less mature organizations execute more evaluative projects because UX Research is less integrated into their teams.

Methods often employed: usability testing, eye tracking, surveys, NPS, benchmarking.

## A Note About Methods and Process

There are infinite variations on activities and methods. Teams adapt them for varying budgets, timelines, skill levels, and organizational maturity. There is always something UX Research can do to bring insights to the organization.

## Basic Project Process

Every UX Research project — regardless of type — follows this basic process. Highly skilled practitioners implicitly follow it even when they don't explicitly call out each step.

### 1. Intake
Capture the idea, question, or business need. Projects can be stakeholder-suggested or self-generated by the UX Research team when it sees an unfulfilled organizational need. Intake uses the framing document's questions to lead and document business needs, timeline, and scope. Output: first-pass framing document. Duration: 1 hour to weeks.

### 2. Enter in Backlog
Every request or idea enters the running project backlog (maintained in Aha!) so the team can monitor demand, resourcing, and organizational visibility. Output: Aha! project tile. Duration: less than an hour.

### 3. Prioritize in Backlog
On a regular cadence, the UXR team reviews the backlog with UX leadership and other stakeholders to align to Boomi strategic initiatives and pull projects forward when needed. Prioritization happens in face-to-face meetings or asynchronously. Output: prioritized backlog.

### 4. Kickoff
Initial meeting with stakeholders to reconfirm roles, goals, framing document, and project process. Stakeholder alignment on the framing document increases buy-in, which speeds later steps that need stakeholder assistance (identifying customers, recruiting). Output: finalized framing document. Duration: 1–2 hour meeting.

### 5. Identify Customers
Navigate Boomi's complex data landscape to identify a representative pool of potential participants. Each project has participant criteria documented in the framing document. Representative high-quality feedback is the hallmark of a mature UX Research practice; using a small relationship-based pool risks a feedback echo chamber — hearing from the same participants over and over, or Boomi-biased customers, skews results toward "what Boomi wants because Boomi suggested it."

Data sources include: Customer Research Panel, previous project lists, Product Management, Pendo, Engineering (data and metrics), Training, Customer Success, Customer Support, Marketing, Learning & Development, the data warehouse, and Business Operations (Salesforce). Teams often provide incomplete data sets that require crosswalking across sources.

Output: enriched spreadsheet / customer list. Duration: 1–8 weeks (highly variable).

### 6. Recruit
Contact target participants. Channels include email, Pendo live intercepts (in-platform pop-ups), warm introductions from internal Boomi colleagues (e.g., a CS rep brokering an introduction), or recruitment firms/platforms (rarely used due to budget). Duration is highly variable and depends on time of day/week/year, list quality, incentive offered, prior email volume to a domain, pendo guide volume, email subject-line reach, and contact fatigue.

Output: end-to-end participant communication plan (initial, follow-up, next-steps).

### 7. Screen
Participants answer questions to verify they qualify: independently verify Boomi data, fill gaps (e.g., experience level), confirm they can share their screen. Typically a Google Form auto-qualifies; manual screening involves a researcher reviewing responses. Output: list of qualified participants.

### 8. Schedule Sessions
Qualified participants book time through Calendly (or equivalent). The project team is also invited when observation is appropriate. Output: schedule of sessions.

### 9. Plan Activities
Compose activity protocols — everything that will be said and done during an activity. Opportunities with participants are a gift to be used fully; careful planning is how UXR and the project team craft moments that uncover insights. Output: session protocols (format varies by method). Duration: 1 day to 1 week, often dependent on other team members producing materials (prototypes, data sets).

### 10. Conduct Activities
Engage customers one-on-one, in small groups, or via unmoderated activities to learn about their experiences with our products and services. The goal is to understand mindsets, motivations, and behaviors before, during, and after product use. Output: notes, recordings, and participant-created artifacts. Duration: typically 1–2 weeks to collect enough data for trends to emerge.

### 11. Analysis and Synthesis
Methodical review of collected data (analysis) and sense-making of what it means (synthesis). This is where innovative leaps occur. Crafting frameworks that allow researchers to identify trends and patterns is the end-goal of all prior planning. Synthesis projects a future-state based on those trends.

Forms include spreadsheets, mind-maps, Miro boards, conceptual modeling, and whiteboards — each researcher has their own approach based on training and experience. Project teams may participate in reviewing preliminary or final findings. Best-practice time budget: 4x the duration of participant sessions (five 1-hour sessions → 15 hours of analysis). Output: analysis and synthesis working documents.

### 12. Deliverable Building
Construct the "results" to present to the project team and other stakeholders. Deliverables are the primary mechanism by which insights and recommendations live outside the personal experience of the project team and influence the broader organization.

Forms vary — written reports, slide presentations, journey maps, day-in-the-life narratives, or ongoing consulting partnerships with UX Design. The form depends on how the results will be used organizationally. Duration: typically 1–2 weeks.

### 13. Report Out
Researchers present the results of the project (or phase). Stakeholders attend a scheduled meeting; variations include multi-session workshops and video recordings for async consumption. Output: see Document and archive.

### 14. Document and Archive
Wrap the project into a package that can be saved and shared more widely. Creating institutional knowledge of UX Research findings so the organization can identify longer-term trends is the hallmark of a more mature company — learning from every project, not just each participant. Researchers produce process books and enter project meta-data and deliverables into a UX Research insights library. Duration: typically 2 hours per project.

## Continuous Engagement

A hallmark of a mature UX Research team is that engagements never truly end. Researchers act as consultants throughout the product and service lifecycle. A researcher's role doesn't end with the final report — they stay engaged as products, services, and strategies evolve, keeping end-users central to Boomi's strategy.
`;

export const BUILT_IN_UX_RESEARCH_PROCESS_MEMORY_ID = 'built-in-ux-research-process';
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit`
Expected: No errors.

```bash
git add src/lib/constants.ts
git commit -m "feat(memories): add Boomi UX Research Process content constant"
```

---

## Phase 5 — Memory Seeding Update

### Task 9: Update `use-shared-memories.ts` seed list

**Files:**
- Modify: `src/hooks/use-shared-memories.ts`

- [ ] **Step 1: Extend imports and seed data**

Replace the `BUILT_IN_MEMORIES` constant and its seeding loop. Add category/tags to each entry and include the two new memories.

```ts
// src/hooks/use-shared-memories.ts — near the top imports
import {
  BUILT_IN_COMPANY_CONTEXT,
  BUILT_IN_PRODUCT_CONTEXT,
  BUILT_IN_EXOSPHERE_STORYBOOK,
  BUILT_IN_UX_WRITING_GUIDELINES,
  BUILT_IN_AI_VOICE_GUIDELINES,
  BUILT_IN_UXR_OPERATIONS_GUIDE,            // NEW
  BUILT_IN_UX_RESEARCH_PROCESS,             // NEW
  BUILT_IN_COMPANY_CONTEXT_MEMORY_ID,
  BUILT_IN_PRODUCT_MEMORY_ID,
  BUILT_IN_STORYBOOK_MEMORY_ID,
  BUILT_IN_UX_WRITING_MEMORY_ID,
  BUILT_IN_AI_VOICE_MEMORY_ID,
  BUILT_IN_UXR_OPERATIONS_GUIDE_MEMORY_ID,  // NEW
  BUILT_IN_UX_RESEARCH_PROCESS_MEMORY_ID,   // NEW
  COMPANY_CONTEXT_MEMORY_ID,
  PRODUCT_CONTEXT_MEMORY_IDS,
  DESIGN_SYSTEM_MEMORY_IDS,
  UX_WRITING_MEMORY_IDS,
} from '@/lib/constants';

// Re-export for backward compatibility
export { COMPANY_CONTEXT_MEMORY_ID, PRODUCT_CONTEXT_MEMORY_IDS, DESIGN_SYSTEM_MEMORY_IDS, UX_WRITING_MEMORY_IDS };

interface BuiltInMemorySeed {
  id: string;
  name: string;
  description: string;
  content: string;
  fileName: string;
  category: string;
  tags: string[];
}

const BUILT_IN_MEMORIES: BuiltInMemorySeed[] = [
  {
    id: BUILT_IN_COMPANY_CONTEXT_MEMORY_ID,
    name: 'Boomi Context',
    description: 'Built-in company context for Boomi',
    content: BUILT_IN_COMPANY_CONTEXT,
    fileName: 'boomi-context.md',
    category: 'Company',
    tags: [],
  },
  {
    id: BUILT_IN_PRODUCT_MEMORY_ID,
    name: 'Rivery Context',
    description: 'Built-in product context for Boomi Data Integration (formerly Rivery)',
    content: BUILT_IN_PRODUCT_CONTEXT,
    fileName: 'rivery-context.md',
    category: 'Product',
    tags: [],
  },
  {
    id: BUILT_IN_STORYBOOK_MEMORY_ID,
    name: 'Exosphere Storybook',
    description: 'Built-in design system reference for @boomi/exosphere components, tokens, and patterns',
    content: BUILT_IN_EXOSPHERE_STORYBOOK,
    fileName: 'exosphere-storybook.md',
    category: 'Design System',
    tags: [],
  },
  {
    id: BUILT_IN_UX_WRITING_MEMORY_ID,
    name: 'UX Writing Guidelines',
    description: 'Built-in UX writing guidelines covering voice/tone, content patterns, error messages, CTAs, tooltips, and empty states',
    content: BUILT_IN_UX_WRITING_GUIDELINES,
    fileName: 'ux-writing-guidelines.md',
    category: 'Writing',
    tags: ['Boomi Knowledge'],
  },
  {
    id: BUILT_IN_AI_VOICE_MEMORY_ID,
    name: 'Boomi AI Voice',
    description: 'AI-specific voice and tone guidelines for Boomi AI responses and conversational content patterns',
    content: BUILT_IN_AI_VOICE_GUIDELINES,
    fileName: 'boomi-ai-voice.md',
    category: 'Writing',
    tags: ['Boomi Knowledge'],
  },
  {
    id: BUILT_IN_UXR_OPERATIONS_GUIDE_MEMORY_ID,
    name: 'UXR Operations Guide',
    description: "Research-focused summary of Boomi's UX Research Operations Guide — process, participants, data handling, and findings dissemination",
    content: BUILT_IN_UXR_OPERATIONS_GUIDE,
    fileName: 'uxr-operations-guide.md',
    category: 'UX Research',
    tags: ['Boomi Knowledge'],
  },
  {
    id: BUILT_IN_UX_RESEARCH_PROCESS_MEMORY_ID,
    name: 'UX Research Process',
    description: "Boomi's end-to-end UX Research process: project types (exploratory/generative/evaluative) and the 14-step project workflow",
    content: BUILT_IN_UX_RESEARCH_PROCESS,
    fileName: 'ux-research-process.md',
    category: 'UX Research',
    tags: ['Boomi Knowledge'],
  },
];
```

- [ ] **Step 2: Update the seeding call to pass category/tags**

Inside `ensureBuiltInMemories()`:

```ts
for (const mem of BUILT_IN_MEMORIES) {
  await supabase.rpc('upsert_built_in_memory', {
    p_id: mem.id,
    p_name: mem.name,
    p_description: mem.description,
    p_content: mem.content,
    p_file_name: mem.fileName,
    p_category: mem.category,   // NEW
    p_tags: mem.tags,           // NEW
  });
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-shared-memories.ts
git commit -m "feat(memories): seed category + tags and add 2 UX Research memories"
```

---

### Task 10: Extend `use-shared-memories.test.ts`

**Files:**
- Modify: `src/hooks/use-shared-memories.test.ts`

- [ ] **Step 1: Write failing tests for category/tags seeding**

Add these tests to the existing describe block:

```ts
it('seeds built-in memories with category and tags', async () => {
  const mockClient = createMockClient();
  // simulate upsert
  await mockClient.rpc('upsert_built_in_memory', {
    p_id: 'built-in-uxr-operations-guide',
    p_name: 'UXR Operations Guide',
    p_description: 'Research-focused summary...',
    p_content: '# UXR Ops Guide',
    p_file_name: 'uxr-operations-guide.md',
    p_category: 'UX Research',
    p_tags: ['Boomi Knowledge'],
  });

  const { data } = await mockClient
    .from('shared_memories')
    .select('*')
    .eq('id', 'built-in-uxr-operations-guide')
    .maybeSingle();

  expect(data?.category).toBe('UX Research');
  expect(data?.tags).toContain('Boomi Knowledge');
});

it('existing memories without Boomi Knowledge tag have empty tags', async () => {
  const mockClient = createMockClient();
  await mockClient.rpc('upsert_built_in_memory', {
    p_id: 'built-in-company-context',
    p_name: 'Boomi Context',
    p_description: 'Built-in company context',
    p_content: '# Boomi',
    p_file_name: 'boomi-context.md',
    p_category: 'Company',
    p_tags: [],
  });

  const { data } = await mockClient
    .from('shared_memories')
    .select('*')
    .eq('id', 'built-in-company-context')
    .maybeSingle();

  expect(data?.category).toBe('Company');
  expect(data?.tags).toEqual([]);
});
```

Adjust the mock client to accept `p_category` and `p_tags` in its RPC mock. If the mock client in this test file is hand-rolled, extend it to store these fields on the row.

- [ ] **Step 2: Run**

Run: `npx vitest run src/hooks/use-shared-memories.test.ts`
Expected: PASS (after adjusting the mock to carry the new fields).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-shared-memories.test.ts
git commit -m "test(memories): cover category + tags in seeding"
```

---

## Phase 6 — UI Primitives

### Task 11: `<TagBadge>` component

**Files:**
- Create: `src/components/ui/tag-badge.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/ui/tag-badge.tsx
'use client';

import { Badge } from '@/components/ui/badge';

interface TagBadgeProps {
  tag: string;
}

export function TagBadge({ tag }: TagBadgeProps) {
  // Boomi Knowledge gets a distinctive tint; other tags use default outline.
  const isBoomiKnowledge = tag === 'Boomi Knowledge';
  return (
    <Badge variant={isBoomiKnowledge ? 'secondary' : 'outline'} className="text-[10px] font-medium">
      {tag}
    </Badge>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/tag-badge.tsx
git commit -m "feat(ui): add TagBadge component"
```

---

### Task 12: Render tags on `MemoryCard`

**Files:**
- Modify: `src/components/memories/memory-card.tsx`

- [ ] **Step 1: Add tags rendering**

Import `TagBadge`. In the card body, after the description, add:

```tsx
{memory.tags && memory.tags.length > 0 && (
  <div className="mt-1.5 flex flex-wrap gap-1">
    {memory.tags.map((tag) => (
      <TagBadge key={tag} tag={tag} />
    ))}
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/memories/memory-card.tsx
git commit -m "feat(ui): render tags on MemoryCard"
```

---

### Task 13: Render tags on `SkillCard` + handle `BuiltInSkill` discriminator

**Files:**
- Modify: `src/components/skills/skill-card.tsx`

- [ ] **Step 1: Read current implementation**

Run: `cat src/components/skills/skill-card.tsx`
Expected: Current rendering already discriminates between `MandatorySkill` (has `invocation`) and `SharedSkill` (has `type`).

- [ ] **Step 2: Extend the discriminator to accept `BuiltInSkill`**

```tsx
import type { MandatorySkill } from '@/lib/constants';
import type { BuiltInSkill } from '@/lib/built-in-skills';
import type { SharedSkill } from '@/lib/types';
import { TagBadge } from '@/components/ui/tag-badge';

type AnySkill = MandatorySkill | BuiltInSkill | SharedSkill;

function isMandatory(skill: AnySkill): skill is MandatorySkill {
  return 'invocation' in skill;
}

function isBuiltInContentSkill(skill: AnySkill): skill is BuiltInSkill {
  return 'content' in skill;
}
```

Update the component prop types from `MandatorySkill | SharedSkill` to `AnySkill`. In the card body, after the description, render tags for built-in content skills:

```tsx
{isBuiltInContentSkill(skill) && skill.tags.length > 0 && (
  <div className="mt-1.5 flex flex-wrap gap-1">
    {skill.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
  </div>
)}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/skills/skill-card.tsx
git commit -m "feat(ui): SkillCard handles BuiltInSkill and renders tags"
```

---

## Phase 7 — Category Grouping Helpers

### Task 14: Pure category-grouping helpers (tested)

**Files:**
- Create: `src/lib/category-grouping.ts`
- Test: `src/lib/category-grouping.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/category-grouping.test.ts
import { describe, it, expect } from 'vitest';
import { groupByCategory, orderedCategories } from './category-grouping';

describe('groupByCategory', () => {
  it('groups items by their category', () => {
    const items = [
      { name: 'a', category: 'X' },
      { name: 'b', category: 'Y' },
      { name: 'c', category: 'X' },
    ];
    const groups = groupByCategory(items);
    expect(groups.get('X')).toHaveLength(2);
    expect(groups.get('Y')).toHaveLength(1);
  });

  it('treats null/undefined categories as "Uncategorized"', () => {
    const items = [
      { name: 'a', category: null },
      { name: 'b', category: undefined },
    ];
    const groups = groupByCategory(items);
    expect(groups.get('Uncategorized')).toHaveLength(2);
  });
});

describe('orderedCategories', () => {
  it('returns categories in the requested priority order, with remaining categories alphabetically', () => {
    const result = orderedCategories(
      ['X', 'Y', 'Z', 'A'],
      ['Y', 'A'],
    );
    expect(result).toEqual(['Y', 'A', 'X', 'Z']);
  });
});
```

- [ ] **Step 2: Verify failure**

Run: `npx vitest run src/lib/category-grouping.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```ts
// src/lib/category-grouping.ts
export function groupByCategory<T extends { category?: string | null }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const cat = item.category ?? 'Uncategorized';
    const group = map.get(cat) ?? [];
    group.push(item);
    map.set(cat, group);
  }
  return map;
}

export function orderedCategories(allCategories: string[], priorityOrder: string[]): string[] {
  const remaining = allCategories.filter((c) => !priorityOrder.includes(c)).sort();
  const present = priorityOrder.filter((c) => allCategories.includes(c));
  return [...present, ...remaining];
}
```

- [ ] **Step 4: Run + commit**

Run: `npx vitest run src/lib/category-grouping.test.ts`
Expected: PASS.

```bash
git add src/lib/category-grouping.ts src/lib/category-grouping.test.ts
git commit -m "feat(lib): add pure category-grouping helpers"
```

---

## Phase 8 — Memories Page UI

### Task 15: Update `shared-memory-manager.tsx` to group built-ins by category

**Files:**
- Modify: `src/components/memories/shared-memory-manager.tsx`

- [ ] **Step 1: Import helpers + define category order**

```tsx
import { groupByCategory, orderedCategories } from '@/lib/category-grouping';

const MEMORY_CATEGORY_ORDER = ['UX Research', 'Company', 'Product', 'Design System', 'Writing'];
```

- [ ] **Step 2: Replace the flat built-in render block**

Find the block that maps `builtInMemories` into a single `StaggerContainer`. Replace with grouped rendering:

```tsx
{/* Built-in Memories */}
{builtInMemories.length > 0 && (() => {
  const groups = groupByCategory(builtInMemories);
  const categoryNames = orderedCategories(Array.from(groups.keys()), MEMORY_CATEGORY_ORDER);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Brain className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-base font-semibold">Built-in Memories</h2>
          <p className="text-xs text-muted-foreground">
            {builtInMemories.length} context file{builtInMemories.length !== 1 ? 's' : ''} included by default
          </p>
        </div>
      </div>
      <div className="space-y-6">
        {categoryNames.map((category) => {
          const memories = groups.get(category) ?? [];
          return (
            <section key={category}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {category}
              </h3>
              <StaggerContainer className="grid gap-2 sm:grid-cols-2">
                {memories.map((memory) => (
                  <StaggerItem key={memory.id}>
                    <MemoryCard memory={memory} onView={() => openViewDialog(memory)} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          );
        })}
      </div>
    </div>
  );
})()}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/memories/shared-memory-manager.tsx
git commit -m "feat(ui): group built-in memories by category on /memories"
```

---

## Phase 9 — Skills Page UI

### Task 16: Merge MANDATORY_SKILLS and BUILT_IN_SKILLS on `/skills`

**Files:**
- Modify: `src/components/skills/shared-skill-manager.tsx`

- [ ] **Step 1: Import + unify**

```tsx
import { BUILT_IN_SKILLS, type BuiltInSkill } from '@/lib/built-in-skills';
import { MANDATORY_SKILLS, SKILL_CATEGORIES } from '@/lib/constants';
import { groupByCategory, orderedCategories } from '@/lib/category-grouping';

// Combined view model for built-in skills (both plugin refs and content skills)
type CombinedBuiltInSkill = MandatorySkill | BuiltInSkill;

const SKILL_CATEGORY_ORDER = ['UX Research', 'Design', 'Superpowers', 'Figma', 'Atlassian', 'Claude Management', 'Meta'];
```

- [ ] **Step 2: Replace the existing Built-in Skills section**

Where the component currently iterates `SKILL_CATEGORIES` over `MANDATORY_SKILLS`, replace with a merged iteration:

```tsx
{(() => {
  const all: CombinedBuiltInSkill[] = [...MANDATORY_SKILLS, ...BUILT_IN_SKILLS];
  const groups = groupByCategory(all);
  const categoryNames = orderedCategories(Array.from(groups.keys()), SKILL_CATEGORY_ORDER);
  return (
    <div className="space-y-6">
      {categoryNames.map((category) => {
        const skills = groups.get(category) ?? [];
        return (
          <section key={category}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {category}
            </h3>
            <StaggerContainer className="grid gap-2 sm:grid-cols-2">
              {skills.map((skill) => (
                <StaggerItem key={skill.name}>
                  <SkillCard
                    skill={skill}
                    locked
                    onView={() => openViewDialog(skill)}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        );
      })}
    </div>
  );
})()}
```

Also update the top header count: `{MANDATORY_SKILLS.length + BUILT_IN_SKILLS.length} skills included by default`.

- [ ] **Step 3: Extend the view drawer's `viewingSkill` handling**

The drawer needs to render markdown `content` when viewing a `BuiltInSkill`. Add a new branch parallel to the existing `isMandatory` branch:

```tsx
{viewingSkill && isMandatory(viewingSkill) ? (
  // existing MANDATORY_SKILLS rendering
) : viewingSkill && 'content' in viewingSkill ? (
  <>
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="secondary">{viewingSkill.category}</Badge>
      <Badge variant="outline">Built-in</Badge>
      {viewingSkill.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
      <p className="text-sm">{viewingSkill.description}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-1">Content</p>
      <pre className="whitespace-pre-wrap font-mono text-xs">{viewingSkill.content}</pre>
    </div>
  </>
) : viewingSkill ? (
  // existing SharedSkill rendering
) : null}
```

Update the `useState<MandatorySkill | SharedSkill | null>` to `useState<MandatorySkill | BuiltInSkill | SharedSkill | null>`.

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/skills/shared-skill-manager.tsx
git commit -m "feat(ui): merge built-in content skills into /skills by category"
```

---

## Phase 10 — Picker Updates

### Task 17: `SharedSkillsPicker` — accept `lockedIds` + `builtInSkills`

**Files:**
- Modify: `src/components/skills/shared-skills-picker.tsx`

- [ ] **Step 1: Read the existing picker**

Run: `cat src/components/skills/shared-skills-picker.tsx`

- [ ] **Step 2: Extend the prop types and rendering**

```tsx
import type { SharedSkill } from '@/lib/types';
import type { BuiltInSkill } from '@/lib/built-in-skills';

interface SharedSkillsPickerProps {
  sharedSkills: SharedSkill[];
  builtInSkills?: BuiltInSkill[];  // NEW
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  lockedIds?: string[];            // NEW
}

export function SharedSkillsPicker({
  sharedSkills,
  builtInSkills = [],
  selectedIds,
  onChange,
  lockedIds = [],
}: SharedSkillsPickerProps) {
  function toggle(id: string) {
    if (lockedIds.includes(id)) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  const allItems = [
    ...builtInSkills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      isBuiltIn: true,
      tags: s.tags,
    })),
    ...sharedSkills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      isBuiltIn: false,
      tags: [] as string[],
    })),
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {allItems.map((item) => {
        const isSelected = selectedIds.includes(item.id) || lockedIds.includes(item.id);
        const isLocked = lockedIds.includes(item.id);
        return (
          <label
            key={item.id}
            className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer ${
              isSelected ? 'border-primary bg-primary/5' : 'border-border'
            } ${isLocked ? 'opacity-80 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              disabled={isLocked}
              onChange={() => toggle(item.id)}
              className="mt-1"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{item.name}</span>
                {isLocked && <span className="text-xs">🔒</span>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
```

Adapt to existing picker styles — the above is illustrative; preserve the existing layout/styling where possible and only add the new props behavior.

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/skills/shared-skills-picker.tsx
git commit -m "feat(ui): SharedSkillsPicker accepts lockedIds and builtInSkills"
```

---

## Phase 11 — Researcher Wizard Lock Flow

### Task 18: Reducer prune on method unselect

**Files:**
- Modify: `src/hooks/use-researcher-form.ts`
- Test: `src/hooks/use-researcher-form.test.ts`

- [ ] **Step 1: Write failing test**

Add to `src/hooks/use-researcher-form.test.ts`:

```ts
it('SET_SELECTED_METHODS removes skill IDs that are no longer in selected methods', () => {
  const { result } = renderHook(() => useResearcherForm());

  act(() => {
    result.current.dispatch({ type: 'SET_SELECTED_METHODS', payload: ['heuristic-evaluation', 'persona-development'] });
    result.current.dispatch({ type: 'SET_SHARED_SKILLS', payload: ['heuristic-evaluation', 'persona-development', 'custom-uuid-skill'] });
  });

  expect(result.current.formData.selectedSharedSkillIds).toContain('heuristic-evaluation');

  act(() => {
    result.current.dispatch({ type: 'SET_SELECTED_METHODS', payload: ['persona-development'] });
  });

  // heuristic-evaluation is removed from skills because it matched a removed method ID
  expect(result.current.formData.selectedSharedSkillIds).not.toContain('heuristic-evaluation');
  // persona-development stays because the method is still selected
  expect(result.current.formData.selectedSharedSkillIds).toContain('persona-development');
  // unrelated custom skill stays
  expect(result.current.formData.selectedSharedSkillIds).toContain('custom-uuid-skill');
});
```

- [ ] **Step 2: Verify failure**

Run: `npx vitest run src/hooks/use-researcher-form.test.ts`
Expected: FAIL — stale skill ID is not pruned.

- [ ] **Step 3: Update the reducer**

```ts
case 'SET_SELECTED_METHODS': {
  const newMethodIds = action.payload;
  // Prune stale method-derived skill IDs: if a skill ID matches a method ID that's no longer selected, drop it.
  const previousMethodIds = state.selectedMethodIds;
  const removedMethodIds = previousMethodIds.filter((id) => !newMethodIds.includes(id));
  const prunedSkillIds = state.selectedSharedSkillIds.filter((id) => !removedMethodIds.includes(id));
  return {
    ...state,
    selectedMethodIds: newMethodIds,
    selectedSharedSkillIds: prunedSkillIds,
  };
}
```

- [ ] **Step 4: Run + commit**

Run: `npx vitest run src/hooks/use-researcher-form.test.ts`
Expected: PASS.

```bash
git add src/hooks/use-researcher-form.ts src/hooks/use-researcher-form.test.ts
git commit -m "feat(researcher): prune skill IDs when methods are unselected"
```

---

### Task 19: `step-skills-memories.tsx` (Researcher) — accept `lockedSkillIds`

**Files:**
- Modify: `src/components/researcher/wizard/step-skills-memories.tsx`

- [ ] **Step 1: Add prop + pass to picker**

```tsx
interface StepSkillsMemoriesProps {
  // ... existing props ...
  lockedSkillIds?: string[];  // NEW
  builtInSkills?: BuiltInSkill[];  // NEW
}

export function StepSkillsMemories({
  // ...
  lockedSkillIds = [],
  builtInSkills = [],
}: StepSkillsMemoriesProps) {
  // ...
  <SharedSkillsPicker
    sharedSkills={sharedSkills}
    builtInSkills={builtInSkills}
    selectedIds={selectedSharedSkillIds}
    onChange={onSharedSkillsChange}
    lockedIds={lockedSkillIds}
  />
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/researcher/wizard/step-skills-memories.tsx
git commit -m "feat(researcher): skills-memories step accepts lockedSkillIds"
```

---

### Task 20: Wire lock derivation in the Researcher wizard shell

**Files:**
- Modify: `src/app/researcher/new/page.tsx` (or the wizard shell that orchestrates step rendering)

- [ ] **Step 1: Locate the shell**

Run: `rg -l "StepSkillsMemories" src/app/researcher src/components/researcher`
Expected: The page or shell component that renders `<StepSkillsMemories>`.

- [ ] **Step 2: Derive and pass `lockedSkillIds` + filtered built-in skills**

```tsx
import { BUILT_IN_SKILLS } from '@/lib/built-in-skills';

// In the shell:
const lockedSkillIds = formData.selectedMethodIds;
const uxResearchBuiltInSkills = BUILT_IN_SKILLS.filter((s) => s.category === 'UX Research');

// When rendering the step:
<StepSkillsMemories
  // ... existing props ...
  lockedSkillIds={lockedSkillIds}
  builtInSkills={uxResearchBuiltInSkills}
/>
```

Also ensure `onSharedSkillsChange` union-merges with lockedSkillIds when persisting the project — e.g., on save:

```tsx
const finalSkillIds = Array.from(new Set([...lockedSkillIds, ...formData.selectedSharedSkillIds]));
await saveProject({ ...formData, selectedSharedSkillIds: finalSkillIds });
```

Place this union logic at the save step (project persistence), not on every render — we want the locked IDs to be the authoritative source during the wizard, merged into the stored selection at save time.

- [ ] **Step 3: Typecheck + smoke test**

Run: `npx tsc --noEmit`
Manual: `npm run dev`, open a Researcher project in the wizard, pick a method, navigate to Skills & Memories, confirm the method appears pre-selected with a lock indicator.

- [ ] **Step 4: Commit**

```bash
git add src/app/researcher/new/page.tsx
git commit -m "feat(researcher): derive lockedSkillIds from selected methods"
```

---

## Phase 12 — Edge Function Updates

### Task 21: Integrate built-in skill resolution in `researcher-execute`

**Files:**
- Modify: `supabase/functions/researcher-execute/index.ts`

Edge Functions can't import from `src/` — we duplicate the built-in skill map, same pattern as `BUILT_IN_RESEARCH_METHODS`.

- [ ] **Step 1: Refactor `getFrameworkGuidance` into a lookup map**

The existing `getFrameworkGuidance(methodId)` function is a `switch` statement (lines ~209-367) returning the framework text per method. Refactor this into a plain map so the same per-method guidance can be reused for skill content without duplication.

Replace the function with:

```ts
// Same framework guidance as before; single source of truth now used by both
// system-prompt building and built-in skill content rendering.
const FRAMEWORK_GUIDANCE: Record<string, string> = {
  'heuristic-evaluation': `Apply Jakob Nielsen's 10 Usability Heuristics:
1. Visibility of system status
2. Match between system and the real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

Rate each violation: Cosmetic (0), Minor (1), Major (2), Catastrophic (3).
Include the specific heuristic violated, the location in the UI, and a concrete recommendation.`,

  'cognitive-walkthrough': `For each task step, evaluate these four questions:
1. Will users try to achieve the right effect? (Goal formation)
2. Will users notice the correct action is available? (Action visibility)
3. Will users associate the correct action with the desired effect? (Action-effect mapping)
4. Will users understand the feedback after the action? (Feedback interpretation)

Mark each step as PASS or FAIL per question. Identify confusion points and provide specific remediation.`,

  'accessibility-audit': `Evaluate against WCAG 2.1 AA guidelines across these categories:
- Perceivable: Text alternatives, adaptable content, distinguishable elements
- Operable: Keyboard accessible, sufficient time, no seizure-inducing content, navigable
- Understandable: Readable, predictable, input assistance
- Robust: Compatible with assistive technologies

Rate issues by conformance level (A, AA, AAA) and impact severity.`,

  'ia-review': `Evaluate Information Architecture across:
- Organization schemes: How content is categorized and grouped
- Labeling systems: Terminology clarity and consistency
- Navigation systems: Wayfinding and movement between sections
- Search systems: Findability of content
- Mental model alignment: Does the structure match user expectations?

Use card sorting principles to suggest restructuring where needed.`,

  'usability-test-plan': `Create a complete test plan including:
- Study objectives and research questions
- Participant screener with inclusion/exclusion criteria
- Task scenarios (5-8 tasks with success criteria)
- Metrics: task completion rate, time on task, error rate, SUS score
- Moderator guide with probing questions
- Pre/post-test questionnaires
- Analysis framework and reporting template`,

  'ux-metrics-framework': `Define metrics using the HEART framework (Happiness, Engagement, Adoption, Retention, Task success) plus:
- Behavioral metrics: What users do (click-through rates, task completion, error rates)
- Attitudinal metrics: What users feel (NPS, SUS, CSAT)
- Custom metrics: Product-specific KPIs
- Measurement methodology: How to collect each metric
- Benchmarks: Industry standards and targets
- Dashboard structure: How to visualize and track over time`,

  'persona-development': `Create 3-5 distinct user personas, each including:
- Name, role, and demographic snapshot
- Goals and motivations (primary and secondary)
- Pain points and frustrations
- Behaviors and habits (technology usage patterns)
- A day-in-the-life scenario
- A representative quote
- Key needs from the product

Base personas on the target audience data provided. Make them specific and realistic, not generic archetypes.`,

  'user-journey-mapping': `Map the journey across these stages:
- Awareness: How users discover the product/feature
- Consideration: Evaluation and comparison
- Onboarding: First-time setup and learning
- Usage: Core task completion
- Retention: Ongoing engagement and habit formation
- Advocacy: Sharing and recommending

For each stage, document: user actions, thoughts, emotions (positive/negative), pain points, opportunities, and touchpoints.`,

  'competitive-ux-analysis': `Analyze competitors across these dimensions:
- Feature parity matrix: What exists vs. what's missing
- Interaction patterns: How key tasks are accomplished
- Information architecture: Navigation and content organization
- Visual design and branding: Look, feel, and consistency
- Onboarding experience: First-run and learning curve
- Unique differentiators: What each competitor does uniquely well

Conclude with strategic recommendations for differentiation.`,

  'task-analysis': `Use Hierarchical Task Analysis (HTA) to decompose tasks:
- Identify top-level user goals
- Break each goal into subtasks (2-4 levels deep)
- Document decision points and branching paths
- Measure complexity (number of steps, cognitive load)
- Identify friction points: unnecessary steps, confusing decisions, dead ends
- Recommend optimizations with estimated step reduction`,

  'research-plan': `Create a comprehensive research plan including:
- Research objectives and key questions
- Methods selection with justification for each
- Participant criteria (demographics, experience level, recruitment)
- Timeline with milestones (typically 4-8 weeks)
- Resource requirements (tools, budget, personnel)
- Activity sequence and dependencies
- Risk mitigation strategies
- Deliverables and reporting schedule`,

  'activity-protocol': `Create a detailed session protocol including:
- Introduction script (consent, recording, ground rules)
- Warm-up questions (5 min)
- Core task scenarios with probing questions
- Think-aloud instructions
- Follow-up and clarification prompts
- Debrief questions
- Note-taking template for observers
- Estimated timing per section`,

  'survey-analysis': `Analyze the provided survey data:
- Quantitative analysis: Response distributions, cross-tabulations, correlations
- Qualitative analysis: Thematic coding of open-ended responses
- Sentiment analysis: Overall and per-question sentiment
- Key findings: Top insights ranked by significance
- Segment analysis: Differences across user segments
- Recommended follow-up: Questions for deeper investigation`,

  'interview-analysis': `Analyze the provided interview/session data:
- Affinity mapping: Group related observations into themes
- Theme frequency: How often each theme appears across sessions
- Key quotes: Representative verbatim quotes per theme
- Pattern analysis: Behavioral patterns and mental models
- Persona refinements: How findings update existing personas
- Actionable recommendations: Prioritized by impact and frequency`,

  'content-audit': `Audit the provided content across:
- Quality: Accuracy, clarity, completeness, currency
- Consistency: Tone, terminology, formatting, structure
- Readability: Grade level, sentence complexity, jargon usage
- Gaps: Missing content, underserved user needs
- Redundancy: Duplicate or overlapping content
- Prioritized recommendations: What to fix, consolidate, or create`,
};

function getFrameworkGuidance(methodId: string): string {
  return FRAMEWORK_GUIDANCE[methodId]
    ?? 'Follow established UX research best practices for this method. Structure your output clearly with headings and actionable findings.';
}

function getBuiltInSkillContentEdge(id: string): { name: string; content: string } | null {
  const method = BUILT_IN_RESEARCH_METHODS.find((m) => m.id === id);
  const framework = FRAMEWORK_GUIDANCE[id];
  if (!method || !framework) return null;
  const content = `# ${method.name}

## Purpose
${method.description}

## Framework & Approach
${framework}

## Expected Output
${method.outputFormat}

## Instructions
When invoked, produce a well-structured markdown document that follows the framework above. Use clear headings (##, ###), include specific and actionable findings, rate severity or priority where applicable, and tie recommendations back to the research context provided by the researcher.`;
  return { name: method.name, content };
}
```

The `FRAMEWORK_GUIDANCE` map becomes the single source of truth for framework guidance (used by both the system prompt via `getFrameworkGuidance` and the skill content via `getBuiltInSkillContentEdge`). No content is duplicated within this file.

**Parity with frontend:** The same `FRAMEWORK_GUIDANCE` map lives in `src/lib/built-in-skills.ts` (Task 5). Keep them identical. An optional future parity test can compare the two maps by hash.

- [ ] **Step 2: Update `loadSkillsContent` to resolve built-ins first**

Replace the existing function body with:

```ts
async function loadSkillsContent(
  supabase: ReturnType<typeof createClient>,
  sharedSkillIds: string[],
  customSkills: { name: string; content: string }[],
): Promise<string> {
  const parts: string[] = [];

  // Partition IDs: built-in string IDs vs DB UUIDs
  const builtInHits: { name: string; content: string }[] = [];
  const dbIds: string[] = [];
  for (const id of sharedSkillIds) {
    const bi = getBuiltInSkillContentEdge(id);
    if (bi) {
      builtInHits.push(bi);
    } else {
      dbIds.push(id);
    }
  }

  for (const bi of builtInHits) {
    parts.push(`### ${bi.name}\n${bi.content}`);
  }

  if (dbIds.length > 0) {
    const { data: skills } = await supabase
      .from('shared_skills')
      .select('name, url_value, file_content')
      .in('id', dbIds);

    if (skills) {
      for (const skill of skills) {
        if (skill.url_value) {
          parts.push(`### ${skill.name}\nURL: ${skill.url_value}`);
        } else if (skill.file_content) {
          const content = typeof skill.file_content === 'string'
            ? skill.file_content
            : JSON.stringify(skill.file_content);
          parts.push(`### ${skill.name}\n${content}`);
        }
      }
    }
  }

  for (const skill of customSkills) {
    if (skill.content) {
      parts.push(`### ${skill.name}\n${skill.content}`);
    }
  }

  return parts.join('\n\n');
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/researcher-execute/index.ts
git commit -m "feat(researcher-execute): resolve built-in skills before DB query"
```

---

### Task 22: Model upgrade — Opus 4.7 with max extended thinking

**Files:**
- Modify: `supabase/functions/researcher-execute/index.ts`

- [ ] **Step 1: Invoke the claude-api skill to verify max thinking budget for `claude-opus-4-7`**

Run the `claude-api` skill (available in the plugins). Ask it: *"What is the maximum supported `budget_tokens` for extended thinking with `claude-opus-4-7`? What `max_tokens` value should I pair with the maximum thinking budget? Any required beta headers?"*

Record the exact values returned. Proceed once you have them.

- [ ] **Step 2: Update the per-method call (line ~602)**

```ts
const message = await anthropic.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: <MAX_TOKENS_VALUE>,
  thinking: { type: 'enabled', budget_tokens: <MAX_BUDGET_TOKENS_VALUE> },
  system: systemPrompt,
  messages: [{ role: 'user', content: userMessage }],
});
```

Replace the placeholders with the values from Step 1. Add any beta headers the skill mentioned (via the `headers` or `defaultHeaders` config on the `Anthropic` client, or as an extra arg on the call if the SDK supports it).

- [ ] **Step 3: Update the synthesis call (line ~691)**

Find the second `anthropic.messages.create` invocation (synthesis step for executive summary / process book). Apply the same model + thinking + max_tokens changes. The prompt and messages stay as-is.

- [ ] **Step 4: Verify thinking-token accounting logic still works**

The existing code extracts thinking tokens from `message.content.find(b => b.type === 'thinking')` and `message.usage.thinking_tokens`. With the newer model, ensure the shapes are identical. If the SDK version needs bumping for `claude-opus-4-7` support, update `npm:@anthropic-ai/sdk@0.39` to the latest compatible version in the import statement.

- [ ] **Step 5: Deploy locally + smoke test**

Run: `supabase functions deploy researcher-execute --no-verify-jwt`
Manual: Run a full Researcher project end-to-end from the UI. Check the Supabase Edge Function logs to confirm the request is hitting `claude-opus-4-7` (not the old model) and that the response completes without thinking-related errors.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/researcher-execute/index.ts
git commit -m "feat(researcher-execute): upgrade to Claude Opus 4.7 with max extended thinking"
```

---

## Phase 13 — Tests & QA

### Task 23: Extend researcher fixtures for the lock flow

**Files:**
- Modify: `src/test/helpers/researcher-fixtures.ts`

- [ ] **Step 1: Add a fixture**

Inspect existing fixtures. Add:

```ts
export const fixtureProjectWithLockedSkills = {
  ...fixtureEmptyProject,  // or equivalent base
  selectedMethodIds: ['heuristic-evaluation', 'persona-development'],
  selectedSharedSkillIds: ['heuristic-evaluation', 'persona-development'],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/test/helpers/researcher-fixtures.ts
git commit -m "test(researcher): fixture for project with locked skills"
```

---

### Task 24: Full test suite run

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests PASS. Any failures indicate regressions from refactors — fix before proceeding.

- [ ] **Step 2: Coverage check on changed files**

Run: `npm run test:coverage`
Expected: Non-trivial coverage on `src/lib/built-in-skills.ts`, `src/lib/skill-resolver.ts`, `src/lib/category-grouping.ts`, `src/hooks/use-researcher-form.ts`.

- [ ] **Step 3: Typecheck + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit any fixes**

```bash
git add -u
git commit -m "test: fix regressions from built-in skills/memories refactor"
```
(Only commit if there were fixes — skip if clean.)

---

### Task 25: Manual QA checklist

**Do not mark this task complete without personally completing each step.**

- [ ] **`/memories` page:**
  - Built-in memories appear grouped by category (UX Research / Company / Product / Design System / Writing) in that order
  - UXR Operations Guide and UX Research Process appear under "UX Research" with a "Boomi Knowledge" badge
  - UX Writing Guidelines and Boomi AI Voice retain their "Boomi Knowledge" badge under "Writing"
  - View drawer opens correctly for each
  - Custom memories section unchanged

- [ ] **`/skills` page:**
  - Built-in Skills section includes "UX Research" category as the first group
  - All 15 research method skills appear under "UX Research" with their lucide icons
  - No built-in skill has a "Boomi Knowledge" tag
  - Other categories (Design, Superpowers, Figma, Atlassian, Claude Management, Meta) remain populated
  - View drawer for a UX Research skill shows the markdown content
  - View drawer for a MANDATORY skill (e.g. `frontend-design`) still shows invocation + repo URL
  - Custom Shared Skills section unchanged

- [ ] **Researcher wizard:**
  - Create a new Researcher project
  - On Method Selection step, pick 2 methods (e.g., Heuristic Evaluation + Persona Development)
  - Navigate to Skills & Memories step
  - Confirm both methods appear as pre-checked skills with a lock icon
  - Confirm the lock prevents unchecking
  - Confirm other UX Research skills appear as optional picks
  - Confirm custom skills still appear as optional picks
  - Go back to Method Selection, unselect Heuristic Evaluation
  - Navigate forward again; Heuristic Evaluation should no longer be in the selected skills list

- [ ] **Researcher execution:**
  - Save the project, hit Run
  - Check Supabase function logs: model should be `claude-opus-4-7`, with extended thinking budget at the configured max
  - After completion, open the results drawer — each method has content generated
  - Thinking token count is recorded per method in the UI

- [ ] **Regression smoke test:**
  - Prompt Generator flow still works end-to-end (no built-in skills added there — verify `/prompt-generator/new` wizard renders all steps)
  - UX Writer page still works (unchanged)

---

## Out of Scope (Tracked Separately)

- Model upgrade for `ux-writer-analyze/index.ts:450` (still Sonnet 4 — see project memory `project_model_upgrade_backlog.md`)
- Model audit for Prompt Generator flow (see same memory)
- Surfacing `BUILT_IN_SKILLS` in the Prompt Generator's skill picker
- Moving built-in memories from DB-seeded to code-only (parallel to how skills now live in code)

---

## Self-Review Notes

- **Spec coverage:** All five Sections + Section 6 (Model Upgrade) have corresponding tasks. Section 1 → Tasks 1-6; Section 2 → Tasks 7-9; Section 3 → Tasks 18-20; Section 4 → Tasks 11-17; Section 5 → Tasks 21-22; Section 6 → Task 22.
- **No placeholders:** Exact file paths, exact code blocks, exact commands, exact commit messages throughout. The only deferred value is the numeric `budget_tokens` for Opus 4.7, which is explicitly handed to the `claude-api` skill in Task 22 Step 1 — this is not a placeholder but a verified-at-implementation-time lookup.
- **Type consistency:** `BuiltInSkill` fields consistent across Tasks 5, 6, 17, 19, 20. `ResolvedSkill` union defined in Task 6 used in Task 21. `getBuiltInSkillById` defined in Task 5 used in Task 6. `groupByCategory` / `orderedCategories` defined in Task 14 used in Tasks 15, 16.
