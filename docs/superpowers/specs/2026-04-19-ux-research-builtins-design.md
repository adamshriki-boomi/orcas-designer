# UX Research Built-in Skills & Memories — Design

**Date:** 2026-04-19
**Status:** Design approved, ready for implementation planning

## Goal

Add the Boomi UX Research domain to the Orcas Designer's shared skills/memories system:

- **2 new built-in memories** from pasted Boomi docs (UXR Operations Guide, UX Research Process)
- **15 built-in skills** representing the research methods currently in `researcher-constants.ts`
- **Category grouping** (`Company`, `Product`, `Design System`, `Writing`, `UX Research`) across all built-ins
- **Tag system** with a `Boomi Knowledge` tag marking content sourced from actual Boomi internal docs
- **Auto-lock flow** in the Researcher wizard: picked methods → pre-selected, non-unselectable skills in the Skills & Memories step
- **Model upgrade** for the Researcher Edge Function: Opus 4.0 / Sonnet 4 → Opus 4.7 with max extended thinking

## Guiding Distinction

- **Memory** = passive context ("what is Rivery", "Boomi's UX process")
- **Skill** = active instruction ("perform a heuristic evaluation")

The 15 research methods are instructions for Claude to follow, so they become skills. The 2 Boomi docs are context, so they become memories.

---

## Section 1: Data Model & Storage

### New type: `BuiltInSkill`

New file `src/lib/built-in-skills.ts` exports:

```ts
export interface BuiltInSkill {
  id: string;              // e.g. "heuristic-evaluation" — matches method IDs
  name: string;
  category: string;        // "UX Research"
  tags: string[];          // e.g. ["Boomi Knowledge"] or []
  description: string;
  content: string;         // markdown methodology prose
  icon?: string;           // lucide icon name (optional)
}

export const BUILT_IN_SKILLS: BuiltInSkill[] = [
  // 15 research methods (IDs match researcher-constants.ts)
];
```

Lives in code (not DB). Mirrors `MANDATORY_SKILLS` pattern — built-ins are data constants, not user content. `MANDATORY_SKILLS` remains untouched (still references Anthropic/plugin skills by slash-command `invocation`).

### Schema change — `shared_memories`

```sql
ALTER TABLE shared_memories ADD COLUMN category TEXT;
ALTER TABLE shared_memories ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';
```

The `upsert_built_in_memory` RPC gains `p_category TEXT` and `p_tags TEXT[]` parameters. `use-shared-memories.ts` passes them during seeding.

### Project skill ID resolution

`selected_shared_skill_ids: text[]` (existing) holds a mix of:
- Built-in skill string IDs (e.g. `"heuristic-evaluation"`)
- Custom skill UUIDs (from `shared_skills` table)

New resolver `src/lib/skill-resolver.ts`:

```ts
resolveSkill(id: string, dbSkills: SharedSkill[]): ResolvedSkill | null
```

Tries `BUILT_IN_SKILLS` first (by string match), falls back to DB. Returns a discriminated union `{ kind: 'builtin' | 'db', ... }`. Missing IDs resolve to `null` (gracefully ignored — handles deleted skills still referenced by older projects).

---

## Section 2: Category & Tag Assignments

### Memories (existing + new)

| Name | Category | Tags |
|---|---|---|
| Boomi Context | `Company` | — |
| Rivery Context | `Product` | — |
| Exosphere Storybook | `Design System` | — |
| UX Writing Guidelines | `Writing` | `Boomi Knowledge` |
| Boomi AI Voice | `Writing` | `Boomi Knowledge` |
| **UXR Operations Guide** (new) | `UX Research` | `Boomi Knowledge` |
| **UX Research Process** (new) | `UX Research` | `Boomi Knowledge` |

### UXR Operations Guide content trimming

The source doc (~15,000 words) contains operational tooling detail (Tremendous gift-card procedures, Calendly/Gong/Zoom setup, Salesforce report downloads, Slack templates, Mail Merge steps). These are not useful for AI-assisted research and would dilute Claude's context.

**Decision:** Trim to research-relevant sections only. Keep: UX Research process overview, intake/framing, collaboration, raw data handling policy, incentive guidelines (principle only, not procedures), participant identification rationale, dissemination of findings, UX metrics. Drop: tooling step-by-steps, email templates, Tremendous/Calendly/Gong/Salesforce how-tos.

### Built-in Skills (new — 15 research methods)

All 15 methods from `researcher-constants.ts`: `category: 'UX Research'`, `tags: []` (not Boomi Knowledge — synthesized from general UXR knowledge, not sourced from Boomi docs).

IDs: `heuristic-evaluation`, `cognitive-walkthrough`, `accessibility-audit`, `ia-review`, `usability-test-plan`, `ux-metrics-framework`, `persona-development`, `user-journey-mapping`, `competitive-ux-analysis`, `task-analysis`, `research-plan`, `activity-protocol`, `survey-analysis`, `interview-analysis`, `content-audit`.

### MANDATORY_SKILLS (unchanged)

Existing categories remain: `Design`, `Superpowers`, `Figma`, `Atlassian`, `Claude Management`, `Meta`. No tags.

---

## Section 3: Researcher Wizard — Auto-Lock Flow

The same ID namespace is used for methods (Method Selection step) and skills (Skills & Memories step): `"heuristic-evaluation"` is both. No mapping function needed.

### Data flow

```
Method Selection step
  selectedMethodIds: ["heuristic-evaluation", "persona-development"]
         ↓
Researcher wizard shell derives:
  lockedSkillIds = selectedMethodIds   (same strings)
         ↓
Skills & Memories step receives lockedSkillIds prop
         ↓
SharedSkillsPicker renders them pre-checked + disabled (lock icon)
  + shows other "UX Research" built-in skills as optional picks
  + shows custom skills as optional picks
```

**On save:** `selectedSharedSkillIds` = `lockedSkillIds` ∪ user-picked optional IDs. Locked entries are always included and cannot desync from `selectedMethodIds`.

### Required changes

1. `SharedSkillsPicker` — add `lockedIds?: string[]` prop. Locked items render checked + disabled with a lock icon (mirrors existing `SharedMemoriesPicker` pattern).
2. `step-skills-memories.tsx` (researcher) — accept `lockedSkillIds?: string[]` prop, pass to picker.
3. Researcher wizard shell — derive `lockedSkillIds` from `selectedMethodIds`, pass to step.
4. Picker filtering in Researcher context — show only `category: 'UX Research'` built-in skills + all custom skills. Hide `MANDATORY_SKILLS` and non-UXR built-in skills.
5. Reducer prune — on `SET_SELECTED_METHODS`, also remove any matching IDs from `selectedSharedSkillIds` to prevent stale entries after a method is unselected.

---

## Section 4: UI Changes

### `/skills` page (`shared-skill-manager.tsx`)

Current: "Built-in Skills" (MANDATORY_SKILLS grouped by category) → divider → "Custom Shared Skills".

New: "Built-in Skills" section groups across **both** MANDATORY_SKILLS and BUILT_IN_SKILLS by category:

```
Built-in Skills
├─ UX Research   (NEW — 15 content skills from BUILT_IN_SKILLS)
├─ Design        (existing — plugin refs)
├─ Superpowers
├─ Figma
├─ Atlassian
├─ Claude Management
└─ Meta
─────────────
Custom Shared Skills (unchanged)
```

**View drawer:** discriminator-based rendering:
- If `'invocation' in skill` → show invocation + repoUrl (existing MANDATORY_SKILLS path)
- If `'content' in skill` → show markdown content (new BUILT_IN_SKILLS path, similar to memory view)

Tags render as small badges under the title.

### `/memories` page (`shared-memory-manager.tsx`)

Current: flat "Built-in Memories" grid → divider → "Custom Shared Memories".

New: "Built-in Memories" groups by category:

```
Built-in Memories
├─ UX Research   (NEW — UXR Ops Guide, UX Research Process)
├─ Company       (Boomi Context)
├─ Product       (Rivery Context)
├─ Design System (Exosphere Storybook)
└─ Writing       (UX Writing Guidelines, Boomi AI Voice)
─────────────
Custom Shared Memories (unchanged)
```

Cards render tag badges (small "Boomi Knowledge" badge where applicable).

### Pickers

- `SharedSkillsPicker` gains `lockedIds?: string[]` and `builtInSkills?: BuiltInSkill[]` props. Renders built-in skills as a section above custom skills, discriminated at render time.
- `SharedMemoriesPicker` already supports `lockedIds`. May gain a `categoryFilter?: string` prop if Researcher wants to filter to `UX Research` only.

### Cards

`SkillCard` and `MemoryCard` render `tags` as small badges below the description. New thin `<TagBadge>` component wraps existing `<Badge>` with a distinct style for `Boomi Knowledge` (outlined, tinted).

---

## Section 5: Execution & Prompt Impact

### Researcher Edge Function (`supabase/functions/researcher-execute`)

Where it iterates `selectedSharedSkillIds` and materializes skills into the prompt, switch to `resolveSkill(id, dbSkills)`. Built-ins return `{ kind: 'builtin', content, name }` — inject `content` as `<skill name="…">…</skill>` blocks. DB skills continue fetching URL/file content as today.

### Prompt Generator scope — deliberately out

The Prompt Generator's skill picker currently shows DB skills only. `BUILT_IN_SKILLS` (UX Research methods) are not added there — `Heuristic Evaluation` isn't relevant to implementation prompts. Only the Researcher wizard's picker surfaces them. The /skills page (management view) shows all built-ins regardless.

### Memories — no execution changes

New built-in memories are regular `shared_memories` rows with `content`. They flow through existing memory-section logic. `category` and `tags` columns are presentation metadata only.

---

## Section 6: Model Upgrade

### Current state (`supabase/functions/researcher-execute/index.ts`)

- Line 603 — per-method execution: `claude-opus-4-0-20250514` (Opus 4.0), `thinking.budget_tokens: 10000`, `max_tokens: 16384`
- Line 691 — synthesis (executive summary + process book): `claude-sonnet-4-20250514` (Sonnet 4)

### Target state

Both call sites upgrade to:

- Model: `claude-opus-4-7`
- Extended thinking enabled at **max supported `budget_tokens`** (exact value verified against Anthropic docs during implementation via the `claude-api` skill)
- `max_tokens` bumped accordingly to accommodate the thinking budget plus output

No changes to the synthesis/execution structure, just model + thinking config.

### Out of scope (deferred)

- `supabase/functions/ux-writer-analyze/index.ts:450` still on Sonnet 4 — deferred as follow-up
- Prompt Generator model config — deferred as follow-up
- Tracked in project memory: `project_model_upgrade_backlog.md`

---

## Testing

### Unit tests (new or extended)

- `built-in-skills.test.ts` — all 15 entries well-formed, IDs match `researcher-constants.ts` method IDs exactly, no duplicates, required fields present
- `skill-resolver.test.ts` — built-in hit, DB hit, miss (returns null), mixed array resolution
- `use-shared-memories.test.ts` — extend to cover category/tags in seed + upsert
- `use-researcher-form.test.ts` — reducer prunes `selectedSharedSkillIds` when a method is unselected

### Integration

- Researcher project with a picked method produces a prompt containing that method's `<skill>` block. Mock the Edge Function flow; assert the injected content comes from `BUILT_IN_SKILLS`.

### Fixtures

- `src/test/helpers/researcher-fixtures.ts` — add fixture project that exercises the lock flow (methods picked → locked skills in Skills step)

### Manual QA

- /skills page renders new category sections with tag badges
- /memories page renders new category sections with tag badges
- Researcher wizard: pick a method → Skills step shows it pre-checked and disabled with lock icon
- Researcher wizard: unpick a method → it disappears from locked skills
- Create a researcher project, run it, verify the generated prompt includes the expected `<skill>` blocks
- Model upgrade: smoke test a research run, confirm `opus-4-7` is used (check Anthropic dashboard / response metadata)

---

## Migration & Rollout

1. DB migration (`shared_memories` category/tags) — additive, safe to deploy independently
2. Update `upsert_built_in_memory` RPC signature
3. Seed new built-in memories on next client load (existing seed-on-load hook handles this)
4. Deploy code changes (built-in skills file, resolver, picker updates, page updates, wizard lock flow)
5. Deploy Edge Function model upgrade

No data migration for existing memories — they get `category = NULL` and `tags = '{}'`. The client-side seed upsert backfills the existing built-ins with categories on the next load.

---

## Out of Scope

- Surfacing `BUILT_IN_SKILLS` in the Prompt Generator picker
- Model upgrade for `ux-writer-analyze` and Prompt Generator (tracked separately)
- User-editable category/tag system (categories and tags are author-defined in code for now)
- Moving `shared_memories` built-ins from DB-seeded to code-only (out-of-scope refactor)
