// Visual QA — analyze edge function.
// Mirrors ux-writer-analyze. The prompt-building / response-parsing logic is
// intentionally inlined here (Supabase does not bundle imports outside the
// function dir). The canonical, unit-tested versions live in:
//   src/lib/visual-qa-payload.ts   (system prompt + user message)
//   src/lib/visual-qa-utils.ts     (response normalization)
//   src/lib/figma-url.ts           (Figma URL parsing)
// Keep both copies in sync when changing the schema.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.90.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_MEDIA_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
type ImageMime = (typeof ALLOWED_MEDIA_TYPES)[number];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const VISUAL_QA_CATEGORIES = [
  "Layout",
  "Typography",
  "Color",
  "Iconography",
  "Content",
  "Interaction",
  "Accessibility",
  "Component",
] as const;

const ALWAYS_ON_MEMORY_IDS = [
  "built-in-exosphere-visual-qa",
  "built-in-company-context",
  "built-in-rivery-context",
] as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractAnthropicDetail(error: Anthropic.APIError): string {
  const body = (error as { error?: { error?: { message?: string } } }).error;
  return body?.error?.message ?? "";
}

interface FigmaNodeRef {
  fileKey: string;
  nodeId: string;
}

function parseFigmaNodeUrl(input: string): FigmaNodeRef | null {
  if (!input) return null;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (!/(^|\.)figma\.com$/i.test(url.hostname)) return null;
  const rawNodeId = url.searchParams.get("node-id");
  if (!rawNodeId) return null;
  const nodeId = rawNodeId.replace(/-/g, ":");
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  if (segments[0] !== "file" && segments[0] !== "design") return null;
  let fileKey = segments[1];
  if (segments[2] === "branch" && segments[3]) fileKey = segments[3];
  if (!fileKey) return null;
  return { fileKey, nodeId };
}

function buildSchemaInstructions(): string {
  const categories = VISUAL_QA_CATEGORIES.join(" | ");
  return [
    "Return strict JSON with this exact shape and nothing else (no prose, no fences):",
    "{",
    '  "summary": string,',
    '  "findings": [',
    "    {",
    '      "severity": "low" | "medium" | "high",',
    `      "category": "${categories}",`,
    '      "exosphereComponent": string,     // optional',
    '      "location": string,',
    '      "description": string,',
    '      "expected": string,',
    '      "actual": string,',
    '      "suggestedFix": string',
    "    }",
    "  ]",
    "}",
    "",
    "Severity rubric:",
    "- low: doesn't affect the total experience",
    "- medium: might affect the total experience",
    "- high: affects the entire experience",
  ].join("\n");
}

interface MemoryRow {
  id: string;
  name: string;
  content: string;
}

function buildSystemPrompt(memories: MemoryRow[]): string {
  const sections: string[] = [];
  sections.push(
    "You are a senior product designer performing a Visual QA review for Boomi.",
    "Compare the implementation against the design and produce a precise, jargon-free report a developer can act on."
  );
  for (const m of memories) {
    if (!m.content) continue;
    sections.push(`## ${m.name}`, m.content);
  }
  sections.push("## Output schema", buildSchemaInstructions());
  return sections.join("\n\n");
}

async function downloadAsBase64(
  url: string,
  authHeader: string | null
): Promise<{ data: string; mime: ImageMime }> {
  const headers: Record<string, string> = {};
  if (authHeader) headers.Authorization = authHeader;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Failed to fetch image (${resp.status})`);
  const contentType = (resp.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim() as ImageMime;
  if (!ALLOWED_MEDIA_TYPES.includes(contentType)) {
    throw new Error(`Unsupported image media type: ${contentType}`);
  }
  const buf = await resp.arrayBuffer();
  if (buf.byteLength > MAX_IMAGE_SIZE) {
    throw new Error("Image is too large (limit 10MB)");
  }
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return { data: btoa(binary), mime: contentType };
}

async function resolveFigmaImage(
  figmaUrl: string,
  figmaToken: string
): Promise<{ data: string; mime: ImageMime }> {
  const ref = parseFigmaNodeUrl(figmaUrl);
  if (!ref) throw new Error("Invalid Figma URL — could not parse fileKey or node-id");

  const apiUrl = `https://api.figma.com/v1/images/${ref.fileKey}?ids=${encodeURIComponent(ref.nodeId)}&format=png&scale=2`;
  const apiResp = await fetch(apiUrl, {
    headers: { "X-Figma-Token": figmaToken },
  });
  if (!apiResp.ok) {
    throw new Error(`Figma API rejected the request (${apiResp.status})`);
  }
  const json = await apiResp.json() as { images?: Record<string, string | null>; err?: string };
  if (json.err) throw new Error(`Figma API error: ${json.err}`);
  const renderedUrl = json.images?.[ref.nodeId];
  if (!renderedUrl) throw new Error("Figma did not render the requested node");
  return downloadAsBase64(renderedUrl, null);
}

interface AiResponse {
  summary: string;
  findings: Array<Record<string, unknown>>;
}

function stripFences(text: string): string {
  const fenced = /^```(?:json|JSON)?\s*\n([\s\S]*?)\n```\s*$/m.exec(text.trim());
  return fenced ? fenced[1] : text;
}

function parseAiResponse(rawText: string): AiResponse {
  const stripped = stripFences(rawText).trim();
  if (!stripped) throw new Error("AI response is empty");
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response is not valid JSON");
    }
    parsed = JSON.parse(stripped.slice(start, end + 1));
  }
  if (typeof parsed !== "object" || parsed === null) throw new Error("AI response is not an object");
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.summary !== "string") throw new Error("AI response missing summary");
  if (!Array.isArray(obj.findings)) throw new Error("AI response missing findings array");
  return { summary: obj.summary, findings: obj.findings as Array<Record<string, unknown>> };
}

function generateId(): string {
  return crypto.randomUUID();
}

interface NormalizedFinding {
  id: string;
  severity: "low" | "medium" | "high";
  category: (typeof VISUAL_QA_CATEGORIES)[number];
  exosphereComponent?: string;
  location: string;
  description: string;
  expected: string;
  actual: string;
  suggestedFix: string;
}

function normalizeFindings(raw: Array<Record<string, unknown>>): NormalizedFinding[] {
  return raw.map((entry, idx) => {
    const sev = typeof entry.severity === "string" ? entry.severity.toLowerCase() : "";
    if (sev !== "low" && sev !== "medium" && sev !== "high") {
      throw new Error(`Finding #${idx} has unknown severity`);
    }
    const cat = typeof entry.category === "string" ? entry.category : "";
    if (!VISUAL_QA_CATEGORIES.includes(cat as (typeof VISUAL_QA_CATEGORIES)[number])) {
      throw new Error(`Finding #${idx} has unknown category`);
    }
    const requireString = (k: string): string => {
      const v = entry[k];
      if (typeof v !== "string") throw new Error(`Finding #${idx} missing string ${k}`);
      return v;
    };
    const out: NormalizedFinding = {
      id: typeof entry.id === "string" && entry.id ? entry.id : generateId(),
      severity: sev,
      category: cat as (typeof VISUAL_QA_CATEGORIES)[number],
      location: requireString("location"),
      description: requireString("description"),
      expected: requireString("expected"),
      actual: requireString("actual"),
      suggestedFix: requireString("suggestedFix"),
    };
    if (typeof entry.exosphereComponent === "string" && entry.exosphereComponent.trim()) {
      out.exosphereComponent = entry.exosphereComponent.trim();
    }
    return out;
  });
}

function computeSeverityCounts(findings: NormalizedFinding[]) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return counts;
}

interface ReportRow {
  id: string;
  user_id: string;
  design_source: "upload" | "figma";
  design_image_url: string;
  design_figma_url: string | null;
  impl_image_url: string;
}

async function persistFigmaRender(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  reportId: string,
  base64: string,
  mime: ImageMime
): Promise<string> {
  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  const path = `${userId}/${reportId}/design-${Date.now()}.${ext}`;
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const { error: uploadError } = await supabase.storage
    .from("visual-qa-uploads")
    .upload(path, bytes, { contentType: mime, upsert: true });
  if (uploadError) {
    throw new Error(`Failed to persist Figma render: ${uploadError.message}`);
  }
  const { data: signed } = await supabase.storage
    .from("visual-qa-uploads")
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year — long-lived for the report
  return signed?.signedUrl ?? path;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate JWT against GoTrue directly (sb_publishable_* anon-key path).
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const authResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      },
    });
    if (!authResp.ok) return jsonResponse({ error: "Unauthorized" }, 401);
    const user = (await authResp.json()) as { id: string };

    const body = await req.json();
    const reportId = typeof body?.reportId === "string" ? body.reportId : "";
    const memoryIds = Array.isArray(body?.memoryIds)
      ? (body.memoryIds as unknown[]).filter((id): id is string => typeof id === "string" && !!id)
      : [];
    if (!reportId) return jsonResponse({ error: "reportId is required" }, 400);

    // Load report (RLS ensures the row belongs to the user).
    const { data: report, error: reportError } = await supabase
      .from("visual_qa_reports")
      .select("id, user_id, design_source, design_image_url, design_figma_url, impl_image_url")
      .eq("id", reportId)
      .maybeSingle<ReportRow>();
    if (reportError || !report) return jsonResponse({ error: "Report not found" }, 404);

    // Read user settings (Claude key always; Figma token only if needed).
    const { data: settings } = await supabase
      .from("user_settings")
      .select("claude_api_key, figma_access_token")
      .eq("user_id", user.id)
      .maybeSingle<{ claude_api_key: string | null; figma_access_token: string | null }>();
    if (!settings?.claude_api_key) {
      return jsonResponse(
        { error: "Claude API key not found. Please add it in Settings." },
        400
      );
    }

    // Mark running.
    await supabase
      .from("visual_qa_reports")
      .update({ status: "running", error: null, updated_at: new Date().toISOString() })
      .eq("id", reportId);

    try {
      // Resolve Design image bytes (and persist a rendered Figma PNG to
      // storage so it's viewable in the report UI).
      let design: { data: string; mime: ImageMime };
      let persistedDesignUrl: string | null = null;
      if (report.design_source === "figma") {
        if (!report.design_figma_url) throw new Error("Figma URL is missing on report");
        if (!settings.figma_access_token) {
          throw new Error("Figma access token not configured. Please add it in Settings.");
        }
        design = await resolveFigmaImage(report.design_figma_url, settings.figma_access_token);
        persistedDesignUrl = await persistFigmaRender(
          supabase,
          user.id,
          report.id,
          design.data,
          design.mime
        );
      } else {
        design = await downloadAsBase64(report.design_image_url, authHeader);
      }

      // Resolve Implementation image bytes.
      const impl = await downloadAsBase64(report.impl_image_url, authHeader);

      // Resolve memories (always-on + user-selected, dedup, preserve order).
      const allIds = Array.from(new Set([...ALWAYS_ON_MEMORY_IDS, ...memoryIds]));
      const { data: memoryRows } = await supabase
        .from("shared_memories")
        .select("id, name, content")
        .in("id", allIds);
      const byId = new Map((memoryRows ?? []).map((m) => [m.id as string, m as MemoryRow]));
      const orderedMemories = allIds
        .map((id) => byId.get(id))
        .filter((m): m is MemoryRow => Boolean(m));

      const systemPrompt = buildSystemPrompt(orderedMemories);

      const anthropic = new Anthropic({ apiKey: settings.claude_api_key });
      const message = await anthropic.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Design (target):" },
              { type: "image", source: { type: "base64", media_type: design.mime, data: design.data } },
              { type: "text", text: "Implementation (current):" },
              { type: "image", source: { type: "base64", media_type: impl.mime, data: impl.data } },
              {
                type: "text",
                text: "Compare the two images and produce the JSON report per the schema in the system prompt.",
              },
            ],
          },
        ],
      });

      const textBlock = message.content.find(
        (b: Anthropic.ContentBlock) => b.type === "text"
      );
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("Claude did not return a text response");
      }
      const ai = parseAiResponse(textBlock.text);
      const findings = normalizeFindings(ai.findings);
      const severityCounts = computeSeverityCounts(findings);

      // Persist results.
      const updatePayload: Record<string, unknown> = {
        status: "complete",
        summary: ai.summary,
        findings,
        severity_counts: severityCounts,
        memory_ids: memoryIds,
        updated_at: new Date().toISOString(),
      };
      if (persistedDesignUrl) updatePayload.design_image_url = persistedDesignUrl;
      await supabase.from("visual_qa_reports").update(updatePayload).eq("id", reportId);

      return jsonResponse({
        ok: true,
        summary: ai.summary,
        findings,
        severityCounts,
      });
    } catch (innerErr) {
      const message = innerErr instanceof Error ? innerErr.message : "Visual QA failed";
      await supabase
        .from("visual_qa_reports")
        .update({
          status: "error",
          error: message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);
      throw innerErr;
    }
  } catch (error: unknown) {
    if (error instanceof Anthropic.AuthenticationError) {
      const detail = extractAnthropicDetail(error);
      const msg = detail
        ? `Claude rejected the API key (${detail}). Please check your key in Settings.`
        : "Invalid Claude API key. Please check your key in Settings.";
      return jsonResponse({ error: msg }, 401);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return jsonResponse({ error: "Rate limit exceeded. Wait a moment and try again." }, 429);
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API error:", error.status, error.message);
      return jsonResponse({ error: "AI service error. Please try again." }, 502);
    }
    if (error instanceof SyntaxError) {
      return jsonResponse({ error: "Failed to parse AI response. Please try again." }, 502);
    }
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Visual QA analyze error:", error);
    return jsonResponse({ error: msg }, 500);
  }
});
