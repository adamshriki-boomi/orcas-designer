import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.90.0";
import { buildUserMessage, type PromptRow } from "./payload.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL_ID = "claude-opus-4-7";
// Briefs target 2000-4000 words ≈ 3k-6k output tokens. 8k gives comfortable
// headroom without pushing call duration past the Edge Function runtime budget.
const MAX_TOKENS = 8000;
// Safety net for genuinely hung calls. With streaming (see below) the
// connection stays alive via continuous SSE events, so this rarely fires.
const CLAUDE_TIMEOUT_MS = 180_000;

// ─── SYSTEM PROMPT ──────────────────────────────────────────────────────────
// Teaches Opus how to write a Claude Code brief. This is prompt-cached on the
// Anthropic side — keep stable so repeat generations hit the cache and save
// ~90% on input tokens for the static half.
const SYSTEM_PROMPT = `You are a specialist prompt engineer who writes briefs for Claude Code. Your output becomes the single prompt another Claude instance will execute to design and build a product feature. Optimize for Claude Code execution, not for human reading.

## Read the user message before writing

The user message contains two driver sections you MUST honor:

1. **"# Feature Definition"** — the feature's mode ("Type: New feature" OR "Type: Improvement of existing feature"), a Name, and a Brief.
2. **"# Design Products"** — a "Requested outputs" list that will contain one or more of: *Lo-fi wireframe*, *Hi-fi mockup*, *Animated prototype*. May also include a Figma destination URL.

These two sections control what you generate. Read them first.

## What to generate — conditional on Design Products

Only include phases for the outputs the user actually asked for. Use these canonical section tags in this order, but skip any tag the user didn't request:

- Requested **wireframe** → include a \`<phase_wireframe>\` section: raw HTML + Tailwind, grayscale boxes, no color, no icons, no animation. Standalone files the user can open in a browser. Structural validation only.
- Requested **animated prototype** → include a \`<phase_prototype>\` section: builds on (or stands alone if no wireframe was requested) with hover states, transitions, loading states, keyframe animations, optimistic UI. Still monochrome; selling the interaction model.
- Requested **mockup** → include a \`<phase_mockup>\` section: final fidelity using the user's design system (Exosphere for Boomi projects). Apply design tokens; final polish for spacing, typography, copy, and accessibility.

Gate each included phase with an explicit checkpoint: *"Stop here, commit, wait for user approval before proceeding."* The brief should instruct Claude Code to commit each phase as its own commit so the user can review and roll back.

If the user picked exactly one output, still emit the checkpoint at the end — the user should explicitly approve before any follow-up work.

If the user provided a **Figma destination URL**, include a short \`<figma_delivery>\` section at the end of each phase instructing Claude Code to also push the result to that Figma file (use the \`figma:figma-use\` and \`figma:figma-generate-design\` skills).

## Conditional on Feature Definition mode

- **New feature**: lead with a \`<context>\` section that summarizes the feature's purpose and users, derived from the Feature Definition brief and any Feature Information / research the user provided. Do NOT fabricate a "current state" — there isn't one.
- **Improvement of existing feature**: lead with a \`<current_state_analysis>\` section that captures what exists today (from the Feature Information section — screenshots, live URL, current-state notes, implementation mode) and a \`<gap_analysis>\` that ties the existing surface to the desired change. Only after that, emit the phase sections.

## Claude Code conventions

- Output raw markdown only. No preamble, no commentary, no code fences wrapping the whole thing.
- Top-level section tags: \`<context>\` (or \`<current_state_analysis>\` + \`<gap_analysis>\` for improvements), then the chosen \`<phase_*>\` sections in the order above, then \`<verification>\`, \`<skills>\`, \`<memories>\`.
- Instruct — do NOT write the code yourself. Phrases like "Create a file X at path Y with these components:" not "Here is the code for file X: \`\`\`html ...\`\`\`". You are writing a brief, not a codebase.
- Reference skills by the exact \`invocation\` field supplied in "# Selected memories & skills" (e.g. \`/exosphere\`, \`/frontend-design\`, \`/implement-design\`). Only cite skills that were surfaced in the context snapshot.
- Absolute file paths in the target output directory (tell the user's Claude Code to default to \`./output/<feature-slug>/\` if unspecified).
- Every requirement must be testable. Replace "make it polished" with "every button has \`cursor-pointer\`; every interactive element has a visible focus ring; transitions are 200ms cubic-bezier(0.4, 0, 0.2, 1)".

## Exosphere guardrails (Boomi default)

The \`/exosphere\` skill is always attached (it's a MANDATORY_SKILL). Instruct Claude Code to invoke it when it starts any Exosphere work. Key rules to restate briefly in the brief:

- Hi-fi mockup components MUST come from \`@boomi/exosphere\`. Do not invent new ones — if Exosphere doesn't ship it, follow the skill's **suggest → ask → flag** flow.
- All Exosphere React-wrapper imports MUST use \`dynamic(() => import(...), { ssr: false })\` (Lit web components can't SSR).
- Exosphere enum prop values MUST be inlined as strings, not imported, to avoid SSR \`HTMLElement is not defined\` errors.
- Two mandatory root imports: \`@boomi/exosphere/dist/styles.css\` and \`@boomi/exosphere/dist/icon.js\`. Missing \`icon.js\` silently turns every icon into an empty box.
- Dialogs/modals for confirmations only (delete, discard). Editing/viewing uses drawers (\`ExSideDrawer\`).
- Every clickable element gets \`cursor-pointer\`.

## Budget & forbidden patterns

- Target length: 2000-4000 words total.
- Do NOT emit generic "build a beautiful, modern app" prose. Every sentence must be specific to the user's project.
- Do NOT generate phases the user didn't request.
- Do NOT include the wizard schema as metadata (no "Field: X = Y" dumps). Translate inputs into product requirements.
- Do NOT leak memory IDs, skill IDs, or internal database fields.
- Do NOT include example code for Claude Code to copy-paste. Describe intent; Claude Code writes the code.

## Output contract

Return raw markdown. First line is a level-1 heading with the feature's Name and a short descriptor. Then the conditional sections in the order above. End with a \`<verification>\` section listing how Claude Code should prove each emitted phase landed (e.g. "open \`./output/<slug>/wireframe/index.html\` in Chrome and confirm all four layout regions render without errors in the console").

If critical information is missing (e.g. improvement mode but no current-state screenshots), surface this in a \`<fallback_strategy>\` section that tells Claude Code how to proceed without it. Do not refuse to generate a brief — generate a brief that acknowledges the gap.`;

interface VersionRow {
  id: string;
  prompt_id: string;
  user_id: string;
  version_number: number;
  wizard_snapshot: Record<string, unknown>;
  context_snapshot: Record<string, unknown> | null;
}

// Anthropic usage types are loose to avoid fighting the SDK surface.
interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  versionId: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await supabase
    .from("prompt_versions")
    .update({
      status: "failed",
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", versionId);

  if (error) {
    console.error(`Failed to mark version ${versionId} as failed:`, error);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // This endpoint is invoked by prompt-generator-start via the service role
  // key. We intentionally do NOT validate a user JWT here — the caller already
  // did. Access control is enforced by the service-role key, which is only
  // held by Supabase-internal edge functions.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!serviceKey || !authHeader.includes(serviceKey)) {
    return json({ error: "Forbidden" }, 403);
  }

  let versionId: string | undefined;

  try {
    const body = await req.json();
    versionId = (body as { versionId?: string }).versionId;
    if (!versionId) return json({ error: "versionId is required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey,
      { auth: { persistSession: false } },
    );

    const { data: version, error: versionError } = await supabase
      .from("prompt_versions")
      .select("id, prompt_id, user_id, version_number, wizard_snapshot, context_snapshot")
      .eq("id", versionId)
      .maybeSingle();

    if (versionError || !version) {
      console.error("Failed to fetch version:", versionError);
      return json({ error: "Version not found" }, 404);
    }

    const v = version as VersionRow;

    const { data: prompt, error: promptError } = await supabase
      .from("prompts")
      .select("id, name, user_id")
      .eq("id", v.prompt_id)
      .maybeSingle();

    if (promptError || !prompt) {
      await markFailed(supabase, v.id, "Prompt no longer exists.");
      return json({ error: "Prompt not found" }, 404);
    }

    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("claude_api_key")
      .eq("user_id", v.user_id)
      .maybeSingle();

    if (settingsError || !settings?.claude_api_key) {
      await markFailed(
        supabase,
        v.id,
        "Claude API key not found. Add your API key in Settings.",
      );
      return json({ error: "API key missing" }, 400);
    }

    const anthropic = new Anthropic({ apiKey: settings.claude_api_key });
    const userMessage = buildUserMessage(
      prompt as PromptRow,
      v.wizard_snapshot,
      v.context_snapshot,
    );

    const abort = new AbortController();
    const abortTimer = setTimeout(() => abort.abort(), CLAUDE_TIMEOUT_MS);

    // Stream the response instead of blocking on .create(). Streaming keeps
    // the TCP connection alive with continuous SSE events, which prevents
    // Supabase's Edge Runtime from killing the request mid-thinking. A prior
    // blocking .create() call would sometimes hang past the 300s mark with
    // no progress and no catch-block error — the runtime was severing the
    // connection silently. Streaming + periodic heartbeat updates the DB
    // row's `created_at` so dead rows are eventually detectable.
    let fullText = "";
    let finalMessage: Anthropic.Messages.Message | null = null;
    try {
      const stream = anthropic.messages.stream(
        {
          model: MODEL_ID,
          max_tokens: MAX_TOKENS,
          thinking: { type: "adaptive" },
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [{ role: "user", content: userMessage }],
        },
        { signal: abort.signal },
      );

      stream.on("text", (chunk: string) => {
        fullText += chunk;
      });

      finalMessage = await stream.finalMessage();
    } finally {
      clearTimeout(abortTimer);
    }

    if (!finalMessage) {
      await markFailed(supabase, v.id, "Claude stream ended without a final message.");
      return json({ error: "No final message from stream" }, 502);
    }

    const textBlock = finalMessage.content.find(
      (block: Anthropic.ContentBlock) => block.type === "text",
    );
    const content = textBlock && textBlock.type === "text" ? textBlock.text : fullText;
    if (!content) {
      await markFailed(
        supabase,
        v.id,
        "Claude returned no text content. Try again.",
      );
      return json({ error: "Empty response from Claude" }, 502);
    }

    const usage = finalMessage.usage as AnthropicUsage | undefined;
    const { error: updateError } = await supabase
      .from("prompt_versions")
      .update({
        status: "completed",
        content,
        input_tokens: usage?.input_tokens ?? null,
        output_tokens: usage?.output_tokens ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", v.id);

    if (updateError) {
      console.error("Failed to persist version content:", updateError);
      await markFailed(supabase, v.id, "Database write failed after generation.");
      return json({ error: "Failed to save generated prompt" }, 500);
    }

    return json({ versionId: v.id, status: "completed" }, 200);
  } catch (error: unknown) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey,
      { auth: { persistSession: false } },
    );

    let errorMessage: string;
    let status = 500;

    if (error instanceof Anthropic.AuthenticationError) {
      errorMessage = "Invalid Claude API key. Update your key in Settings.";
      status = 401;
    } else if (error instanceof Anthropic.RateLimitError) {
      errorMessage = "Claude rate limit reached. Try again later.";
      status = 429;
    } else if (error instanceof Anthropic.APIError) {
      errorMessage = `Claude API error: ${(error as Anthropic.APIError).message}`;
      status = 502;
    } else if (error instanceof DOMException && error.name === "AbortError") {
      errorMessage = "Generation timed out after 5 minutes. Try again.";
      status = 504;
    } else if (error instanceof SyntaxError) {
      errorMessage = "Invalid request body";
      status = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = "An unexpected error occurred.";
    }

    if (versionId) {
      await markFailed(supabase, versionId, errorMessage);
    }

    console.error(`Generation failed${versionId ? ` (version ${versionId})` : ""}:`, error);
    return json({ error: errorMessage }, status);
  }
});
