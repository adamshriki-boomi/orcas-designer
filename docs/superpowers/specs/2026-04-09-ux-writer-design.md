# UX Writer Feature — Design Spec

## Context

The Orcas Designer app helps Boomi designers generate AI prompts for UI design work. The UX Writer feature adds a standalone tool that analyzes UI screenshots and descriptions, then suggests improved copy based on Boomi's UX Writing Guidelines and (optionally) AI Voice guidelines.

This feature leverages the Supabase backend (auth, PostgreSQL, storage, Edge Functions) added in the recent migration.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI proxy | Supabase Edge Function | Browser can't call Claude directly (CORS). Edge Function reads API key from DB server-side. |
| API key storage | Per-user in `user_settings` table | Already exists. Key never sent to browser. |
| Model | Claude Sonnet 4.6 (hardcoded) | Best quality/speed balance for writing tasks. No user selection needed. |
| Input form | Single form, screenshot optional | Simpler than separate modes. AI adapts based on whether screenshot is provided. |
| Output format | Before/after + structured suggestions with explanations | User gets both the comparison and the reasoning. |
| Iteration | Re-run with tweaks | User modifies description/focus and re-runs. No chat, no one-shot. |
| History | Standalone in `ux_writer_analyses` table | Already exists. Per-user, private via RLS. |
| Layout | Split pane (input left, results right) | Form stays visible for re-runs. Workspace feel. |
| UX Writing memory | Always included | Core purpose of the feature. |
| AI Voice memory | Optional toggle (default off) | Only relevant for AI-specific features (chatbot text, AI responses). |

## 1. Architecture

```
Browser                              Supabase
+---------------------+              +----------------------------+
|  /ux-writer page    |              |  Edge Function              |
|                     |              |  /ux-writer-analyze          |
|  Input:             |--POST------->|  - Auth: validates JWT       |
|  - Screenshot (opt) |              |  - Reads API key from        |
|  - Description      |              |    user_settings table       |
|  - Focus notes      |<--JSON------|  - Injects UX Writing memory |
|  - AI Voice toggle  |              |    (+ AI Voice if toggled)   |
|                     |              |  - Calls Claude Sonnet 4.6   |
|  Results:           |              |  - Returns structured JSON   |
|  - Before/After     |              +----------------------------+
|  - Suggestions      |
|  - Explanations     |              +----------------------------+
|                     |              |  PostgreSQL                  |
|  History list       |--CRUD------->|  ux_writer_analyses          |
|                     |              |  user_settings               |
+---------------------+              +----------------------------+

+---------------------+
|  /settings page     |
|  - Theme toggle     |
|  - Claude API key   |
|  - Account info     |
+---------------------+
```

- The Edge Function reads the API key from `user_settings` (key never reaches the browser)
- UX Writing memory content is bundled into the Edge Function as constants
- AI Voice memory is included only when the `includeAiVoice` flag is `true`
- Screenshots are uploaded to `ux-writer-screenshots` Supabase Storage bucket
- The Edge Function receives the screenshot URL (not the raw file)

## 2. UX Writer Page

**Route:** `/ux-writer`
**Sidebar:** New nav item with `PenLine` icon (lucide-react)

### Left Panel (Input)

1. **Screenshot upload** (optional)
   - Drag-and-drop area using existing `FileUpload` component pattern
   - Uploads to `ux-writer-screenshots` Supabase Storage bucket
   - Stores URL for passing to Edge Function
   - Supports image files only (PNG, JPG, WEBP)
   - 10MB limit (bucket policy)

2. **Description** (required)
   - Text field: "Describe the UI element or context"
   - Placeholder: "e.g., Login dialog with error states for invalid credentials"

3. **Focus notes** (optional)
   - Text field: "Focus on specific text types"
   - Placeholder: "e.g., error messages, button labels, tooltips"

4. **AI Voice toggle** (default: off)
   - Label: "Include AI Voice guidelines"
   - Helper text: "Enable for AI-specific features (chatbot responses, AI assistant text)"

5. **Analyze button** (primary)
   - Disabled until description is non-empty
   - Shows loading spinner while analyzing
   - Text changes to "Analyzing..." during request

6. **History list** (below form, collapsible)
   - Shows past analyses: description (truncated) + timestamp
   - Click to reload an analysis (populates input form + shows results)
   - Most recent first
   - Delete button per entry

### Right Panel (Results)

**Empty state:**
- Centered message explaining what the tool does
- "Upload a screenshot or describe a UI element to get started"

**Loading state:**
- Skeleton cards or spinner

**Results state:**
- Summary line at top: "Found N improvements focusing on clarity and plain language."
- Scrollable list of suggestion cards, each containing:
  - **Element type** badge (e.g., "Button Label", "Error Message", "Tooltip", "Dialog Title")
  - **Before** text (struck through, muted/red color)
  - Arrow indicator
  - **After** text (green/success color)
  - **Explanation** — 1-2 sentences on why this is better
  - **Principle** tag — which UX writing guideline it follows

**Re-run flow:**
- User modifies description or focus notes in the left panel
- Clicks "Analyze" again
- Previous results are replaced with new ones
- Each analysis creates a new history entry

## 3. Edge Function: `ux-writer-analyze`

### Request

```
POST /functions/v1/ux-writer-analyze
Authorization: Bearer <supabase-jwt>
Content-Type: application/json

{
  "screenshotUrl": "https://...supabase.co/storage/v1/..." | null,
  "description": "Login dialog with error states",
  "focusNotes": "Focus on error messages" | null,
  "includeAiVoice": false
}
```

### Processing

1. Validate JWT (Supabase auth middleware)
2. Extract `user_id` from JWT
3. Read `claude_api_key` from `user_settings` where `user_id` matches
4. If no API key, return `400 { error: "Set your Claude API key in Settings" }`
5. Build Claude messages:
   - **System message:** UX Writing Guidelines content (+ AI Voice content if `includeAiVoice`)
   - **User message:** Description + focus notes + screenshot image (if URL provided)
   - **Output instruction:** Return JSON matching the response schema
6. Call Claude Sonnet 4.6 (`claude-sonnet-4-6-20250514`) via `@anthropic-ai/sdk`
7. Parse response, return structured JSON

### Response

```json
{
  "suggestions": [
    {
      "elementType": "Button Label",
      "before": "Submit Form",
      "after": "Save changes",
      "explanation": "Use specific action verbs that describe what happens when clicked.",
      "principle": "Action-oriented CTAs"
    }
  ],
  "summary": "Found 5 improvements focusing on clarity and plain language."
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | No API key configured | `{ error: "Set your Claude API key in Settings" }` |
| 400 | Missing description | `{ error: "Description is required" }` |
| 401 | Invalid API key | `{ error: "Invalid Claude API key" }` |
| 429 | Claude rate limit | `{ error: "Rate limited, try again in X seconds" }` |
| 502 | Claude API error | `{ error: "AI service error: <details>" }` |

## 4. Settings Page

**Route:** `/settings`
**Sidebar:** New nav item with `Settings` icon (lucide-react), positioned at bottom of nav

### Section 1: Appearance

- Dark/Light mode toggle
- Same functionality as current sidebar toggle, moved here
- Sidebar toggle removed

### Section 2: AI Configuration

- Claude API key input (password-type, show/hide toggle)
- "Save" button — upserts into `user_settings` table
- Helper text: "Your API key is stored securely and never sent to the browser. Get your key from console.anthropic.com"
- Visual status: saved indicator after successful save

### Section 3: Account

- User avatar + full name + email (from auth profile)
- "Sign out" button
- Sign out and theme toggle removed from sidebar bottom

### Sidebar Changes

- Remove theme toggle button from sidebar bottom
- Remove sign out button from sidebar bottom
- Keep compact user email/avatar display in sidebar
- Add Settings nav link at bottom of nav items list

## 5. Data Flow

### Analysis Flow

```
1. User fills form (description, optional screenshot, optional focus, AI Voice toggle)
2. If screenshot: upload to Supabase Storage -> get public URL
3. POST to Edge Function with { screenshotUrl, description, focusNotes, includeAiVoice }
4. Edge Function:
   a. Validates auth
   b. Reads API key from user_settings
   c. Builds Claude prompt with UX Writing memory (+ AI Voice if toggled)
   d. Calls Claude Sonnet 4.6
   e. Returns structured JSON
5. Browser receives suggestions
6. Save analysis to ux_writer_analyses (input + results)
7. Display results in right panel
```

### History Flow

```
1. On page load: fetch user's analyses from ux_writer_analyses (ordered by created_at DESC)
2. Display in left panel history list
3. Click entry: populate form fields + display stored results (no re-analysis)
4. Delete entry: remove from ux_writer_analyses table
```

## 6. New Files

```
src/app/ux-writer/page.tsx               — UX Writer page (split pane layout)
src/app/settings/page.tsx                — Settings page
src/components/ux-writer/input-panel.tsx  — Left panel (form + history)
src/components/ux-writer/results-panel.tsx — Right panel (suggestions display)
src/components/ux-writer/suggestion-card.tsx — Individual suggestion card
src/components/ux-writer/history-list.tsx — Analysis history list
src/components/settings/appearance-section.tsx — Theme toggle section
src/components/settings/ai-config-section.tsx — API key section
src/components/settings/account-section.tsx — User info + sign out
src/hooks/use-ux-writer.ts              — Hook for analysis logic + state
src/hooks/use-user-settings.ts          — Hook for reading/saving user settings
supabase/functions/ux-writer-analyze/index.ts — Edge Function
```

## 7. Modified Files

```
src/components/layout/left-sidebar.tsx   — Add UX Writer + Settings nav items, remove theme/sign-out
src/app/layout.tsx                       — No changes needed (AppShell already handles auth)
```

## 8. Testing Strategy

### Frontend Tests (Vitest)
- `use-ux-writer.test.ts` — analysis submission, history CRUD, state management
- `use-user-settings.test.ts` — API key read/save/update
- `suggestion-card.test.tsx` — renders before/after/explanation correctly
- `input-panel.test.tsx` — form validation (description required, screenshot optional)
- `results-panel.test.tsx` — empty/loading/results states

### Edge Function Tests (Deno)
- Valid request → calls Claude, returns structured suggestions
- No API key → returns 400 with helpful message
- Invalid API key → returns 401
- Missing description → returns 400
- AI Voice toggle on → includes AI Voice memory in system prompt
- AI Voice toggle off → excludes AI Voice memory

### Integration Tests
- Full flow: upload screenshot → analyze → view results → save to history → reload from history

## 9. Verification Plan

1. Run full test suite: `npm test` — all tests pass
2. Set Claude API key in Settings page
3. Upload a screenshot of a dialog → Analyze → verify structured suggestions appear
4. Describe a UI element without screenshot → Analyze → verify text-only analysis works
5. Toggle AI Voice on → re-analyze → verify suggestions reference AI voice principles
6. Check history: reload page, verify past analyses appear and are clickable
7. Delete a history entry → verify it's removed
8. Test without API key → verify helpful error message directs to Settings
9. Console check: no errors
