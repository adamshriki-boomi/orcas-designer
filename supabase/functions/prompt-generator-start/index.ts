import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Guardrails for cost control. A single generation costs ~$0.10-0.50 of tokens
// and takes 30-90s. Without these, a stuck client retry loop could empty a wallet.
const MAX_HOURLY_COMPLETIONS_PER_PROMPT = 5;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // JWT validation via direct fetch to GoTrue — supabase.auth.getUser() fails
    // with sb_publishable_* anon keys because the SDK session is never populated
    // when the JWT arrives via the global Authorization header.
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const authResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      },
    });
    if (!authResp.ok) return json({ error: "Unauthorized" }, 401);
    const user = (await authResp.json()) as { id: string };

    const body = await req.json();
    const { promptId, wizardSnapshot, contextSnapshot } = body as {
      promptId?: unknown;
      wizardSnapshot?: unknown;
      contextSnapshot?: unknown;
    };

    if (!promptId || typeof promptId !== "string") {
      return json({ error: "promptId is required" }, 400);
    }
    if (!wizardSnapshot || typeof wizardSnapshot !== "object") {
      return json({ error: "wizardSnapshot is required" }, 400);
    }

    // Verify the prompt exists and belongs to this user (RLS also enforces this,
    // but a clear 404 beats a silent insert failure).
    const { data: prompt, error: promptError } = await supabase
      .from("prompts")
      .select("id, user_id")
      .eq("id", promptId)
      .maybeSingle();

    if (promptError) {
      console.error("Failed to fetch prompt:", promptError);
      return json({ error: "Failed to fetch prompt" }, 500);
    }
    if (!prompt) return json({ error: "Prompt not found" }, 404);
    if (prompt.user_id !== user.id) return json({ error: "Unauthorized" }, 403);

    // Require an API key before spending an Opus call.
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("claude_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) {
      console.error("Failed to fetch settings:", settingsError);
      return json({ error: "Failed to fetch user settings" }, 500);
    }
    if (!settings?.claude_api_key) {
      return json(
        { error: "Claude API key not found. Add your API key in Settings." },
        400,
      );
    }

    // Guardrail 1: one in-flight generation per prompt.
    const { data: running } = await supabase
      .from("prompt_versions")
      .select("id")
      .eq("prompt_id", promptId)
      .eq("status", "running")
      .limit(1);

    if (running && running.length > 0) {
      return json(
        { error: "A generation is already running for this prompt." },
        409,
      );
    }

    // Guardrail 2: soft hourly rate limit on completed generations per prompt.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("prompt_versions")
      .select("id", { count: "exact", head: true })
      .eq("prompt_id", promptId)
      .eq("status", "completed")
      .gte("completed_at", oneHourAgo);

    if ((recentCount ?? 0) >= MAX_HOURLY_COMPLETIONS_PER_PROMPT) {
      return json(
        {
          error: `Rate limit: ${MAX_HOURLY_COMPLETIONS_PER_PROMPT} generations per prompt per hour. Try again later.`,
        },
        429,
      );
    }

    // Compute next version_number. Cheap and atomic enough because the unique
    // constraint on (prompt_id, version_number) is a hard backstop; if a race
    // produced a duplicate, the insert would fail and the client retries.
    const { data: latest } = await supabase
      .from("prompt_versions")
      .select("version_number")
      .eq("prompt_id", promptId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latest?.version_number ?? 0) + 1;

    const { data: inserted, error: insertError } = await supabase
      .from("prompt_versions")
      .insert({
        prompt_id: promptId,
        user_id: user.id,
        version_number: nextVersion,
        status: "running",
        wizard_snapshot: wizardSnapshot,
        context_snapshot: contextSnapshot ?? null,
        model: "claude-opus-4-7",
        thinking_enabled: true,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Failed to insert prompt_versions row:", insertError);
      return json({ error: "Failed to start generation" }, 500);
    }

    // Fire-and-forget the worker. Runs on service role so it can read
    // user_settings + write to prompt_versions without a user session.
    const executeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/prompt-generator-execute`;

    EdgeRuntime.waitUntil(
      fetch(executeUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ versionId: inserted.id }),
      }).catch((err) => {
        console.error("Failed to trigger prompt-generator-execute:", err);
      }),
    );

    return json({ versionId: inserted.id, versionNumber: nextVersion }, 200);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return json({ error: "Invalid request body" }, 400);
    }
    console.error("Unexpected error:", error);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
