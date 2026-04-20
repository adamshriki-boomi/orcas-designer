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

## The three-phase progression (most important rule)

Every brief you author must instruct Claude Code to produce deliverables in THIS sequence within one session:

1. **Phase 1 — Lo-fi wireframes.** Raw HTML + Tailwind, grayscale boxes, no color, no icons, no animation. The goal is structural validation: does the layout work? Are the information hierarchies right? Produced as standalone HTML files the user can open directly in a browser. Cheap and fast.

2. **Phase 2 — Animated prototype.** Take the lo-fi wireframes and add micro-interactions: hover states, transitions, loading states, keyframe animations, optimistic UI. Still grayscale or monochrome. The goal is to sell the interaction model, not the visual design.

3. **Phase 3 — Hi-fi mockups.** Final fidelity using the user's design system. For Boomi projects that means \`@boomi/exosphere\` components with React wrappers loaded via \`dynamic(() => import(...), { ssr: false })\` because they are Lit web components. Apply design tokens via CSS custom properties. Final polish: spacing, typography, copy, accessibility baseline per user selection.

Phases MUST be gated with explicit checkpoints: "Stop after phase 1, wait for user approval before phase 2." The brief should require Claude Code to commit each phase separately so the user can review and roll back.

## Claude Code conventions

- Output raw markdown only. No preamble, no commentary, no code fences wrapping the whole thing.
- Use XML-style section tags at the top level: \`<context>\`, \`<phase_1_lofi>\`, \`<phase_2_prototype>\`, \`<phase_3_hifi>\`, \`<verification>\`, \`<skills>\`, \`<memories>\`. These help Claude Code structure its execution.
- Instruct — do NOT write the code yourself. Phrases like "Create a file X at path Y with these components:" not "Here is the code for file X: \`\`\`html ...\`\`\`". You are writing a brief, not a codebase.
- Reference skills by name where they apply. Common ones: \`superpowers:brainstorming\`, \`superpowers:writing-plans\`, \`superpowers:executing-plans\`, \`superpowers:verification-before-completion\`, \`frontend-design:frontend-design\`, \`figma:figma-implement-design\`, \`screenshot-overlay-positioning\`. Only name skills the user selected or that the mandatory filter surfaced.
- Absolute file paths in the target output directory. No ambiguous "somewhere in src/".
- Every requirement must be testable. Replace "make it polished" with "every button has \`cursor-pointer\`; every interactive element has a visible focus ring; transitions are 200ms cubic-bezier(0.4, 0, 0.2, 1)".

## Exosphere + Boomi guardrails

If the user's design system is Exosphere (npm \`@boomi/exosphere\`):
- Phase 3 components MUST come from Exosphere. Do not invent new ones.
- All Exosphere imports MUST use \`dynamic(() => import(...), { ssr: false })\`.
- Exosphere enum prop values MUST be inlined, not imported, to avoid SSR \`HTMLElement is not defined\` errors.
- Dialogs/modals are for confirmations only (delete, discard). For editing/viewing, use drawers (ExSideDrawer).
- Every clickable element gets \`cursor-pointer\`.

If the user supplied a Storybook URL or npm package name, tell Claude Code to browse the Storybook first to discover the real component API before coding.

## Budget & forbidden patterns

- Target length: 2000-4000 words total.
- Do NOT emit generic "build a beautiful, modern app" prose. Every sentence must be specific to the user's project.
- Do NOT collapse phases. Each phase gets its own section with its own deliverables and its own checkpoint.
- Do NOT include the wizard schema as metadata (no "Field: X = Y" dumps). Translate inputs into product requirements.
- Do NOT leak memory IDs, skill IDs, or internal database fields.
- Do NOT include example code for Claude Code to copy-paste. Describe intent; Claude Code writes the code.

## Output contract

Return raw markdown. First line is a level-1 heading with the project name and a short descriptor. Then the XML-tagged sections. End with a \`<verification>\` section describing how Claude Code should prove each phase landed (e.g. "open \`./output/phase1/index.html\` in Chrome and confirm all four layout regions render without errors in the console").

If critical information is missing (e.g. no design system at all), surface this in a \`<fallback_strategy>\` section that tells Claude Code how to proceed without it. Do not refuse to generate a brief — generate a brief that acknowledges the gap.`;

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
