// Visual QA — publish to Confluence edge function.
// Uploads both screenshots as attachments and renders the report as Confluence
// storage-format XHTML. Storage-format renderer is inlined here; the canonical,
// unit-tested version lives at src/lib/visual-qa-confluence.ts — keep them in
// sync when changing the output structure.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

type Severity = "low" | "medium" | "high";

interface Issue {
  id: string;
  severity: Severity;
  category: (typeof VISUAL_QA_CATEGORIES)[number];
  exosphereComponent?: string;
  location: string;
  description: string;
  expected: string;
  actual: string;
  suggestedFix: string;
}

interface ReportRow {
  id: string;
  title: string;
  design_source: "upload" | "figma";
  design_image_url: string;
  design_figma_url: string | null;
  impl_image_url: string;
  status: string;
  summary: string | null;
  severity_counts: { high: number; medium: number; low: number } | null;
  issues: Issue[] | null;
  created_at: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

function severityToPanel(s: Severity): "warning" | "note" | "info" {
  if (s === "high") return "warning";
  if (s === "medium") return "note";
  return "info";
}

function severityLabel(s: Severity): "High" | "Medium" | "Low" {
  if (s === "high") return "High";
  if (s === "medium") return "Medium";
  return "Low";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

function renderHeaderTable(report: ReportRow): string {
  const counts = report.severity_counts ?? { high: 0, medium: 0, low: 0 };
  const rows: string[] = [];
  rows.push(`<tr><th>Date</th><td>${escapeText(formatDate(report.created_at))}</td></tr>`);
  rows.push(
    `<tr><th>Severity counts</th><td>High ${counts.high} · Medium ${counts.medium} · Low ${counts.low}</td></tr>`
  );
  if (report.design_source === "figma" && report.design_figma_url) {
    rows.push(
      `<tr><th>Figma</th><td><a href="${escapeAttr(report.design_figma_url)}">${escapeText(report.design_figma_url)}</a></td></tr>`
    );
  }
  return `<table><tbody>${rows.join("")}</tbody></table>`;
}

function renderImageRow(designName: string, implName: string): string {
  return (
    "<table><tbody><tr>" +
    `<td><strong>Design</strong><br/><ac:image ac:thumbnail="false"><ri:attachment ri:filename="${escapeAttr(designName)}"/></ac:image></td>` +
    `<td><strong>Implementation</strong><br/><ac:image ac:thumbnail="false"><ri:attachment ri:filename="${escapeAttr(implName)}"/></ac:image></td>` +
    "</tr></tbody></table>"
  );
}

function renderIssuePanel(f: Issue): string {
  const macro = severityToPanel(f.severity);
  const badge = f.exosphereComponent
    ? ` · <code>${escapeText(f.exosphereComponent)}</code>`
    : "";
  const body =
    `<p><strong>${severityLabel(f.severity)}</strong> · ${escapeText(f.category)}${badge}</p>` +
    `<p><strong>Location:</strong> ${escapeText(f.location)}</p>` +
    `<p>${escapeText(f.description)}</p>` +
    "<table><tbody>" +
    `<tr><th>Expected</th><td>${escapeText(f.expected)}</td></tr>` +
    `<tr><th>Actual</th><td>${escapeText(f.actual)}</td></tr>` +
    "</tbody></table>" +
    `<p><strong>Suggested fix:</strong> ${escapeText(f.suggestedFix)}</p>`;

  return (
    `<ac:structured-macro ac:name="${macro}">` +
    `<ac:rich-text-body>${body}</ac:rich-text-body>` +
    "</ac:structured-macro>"
  );
}

function renderConfluenceStorage(report: ReportRow, designName: string, implName: string): string {
  const out: string[] = [];
  out.push(`<h1>Visual QA — ${escapeText(report.title)}</h1>`);
  out.push(renderHeaderTable(report));
  out.push("<h2>Design vs Implementation</h2>");
  out.push(renderImageRow(designName, implName));

  if (report.summary) {
    out.push("<h2>Summary</h2>");
    out.push(`<p>${escapeText(report.summary)}</p>`);
  }

  const issues = report.issues ?? [];
  if (issues.length > 0) {
    out.push("<h2>Issues</h2>");
    const grouped = new Map<string, Issue[]>();
    for (const f of issues) {
      const list = grouped.get(f.category) ?? [];
      list.push(f);
      grouped.set(f.category, list);
    }
    for (const [category, items] of grouped.entries()) {
      out.push(`<h2>${escapeText(category)}</h2>`);
      for (const item of items) out.push(renderIssuePanel(item));
    }
  }
  return out.join("\n");
}

async function downloadImage(
  url: string,
  authHeader: string
): Promise<{ blob: Blob; filename: string }> {
  const resp = await fetch(url, { headers: { Authorization: authHeader } });
  if (!resp.ok) throw new Error(`Failed to fetch image (${resp.status})`);
  const blob = await resp.blob();
  // Guess a filename from the URL path; default to .png
  const pathname = (() => {
    try {
      return new URL(url).pathname;
    } catch {
      return "/image.png";
    }
  })();
  const last = pathname.split("/").pop() || "image.png";
  return { blob, filename: last };
}

async function uploadAttachment(
  baseUrl: string,
  basicAuth: string,
  pageId: string,
  blob: Blob,
  filename: string
): Promise<void> {
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("minorEdit", "true");

  const resp = await fetch(
    `${baseUrl}/wiki/rest/api/content/${pageId}/child/attachment`,
    {
      method: "PUT", // PUT updates if exists, creates if not
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "X-Atlassian-Token": "no-check",
      },
      body: form,
    }
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Confluence attachment upload failed (${resp.status}): ${text}`);
  }
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
    const spaceId = typeof body?.spaceKey === "string" ? body.spaceKey : "";
    const parentPageId = typeof body?.parentPageId === "string" ? body.parentPageId : null;
    if (!reportId) return jsonResponse({ error: "reportId is required" }, 400);
    if (!spaceId) return jsonResponse({ error: "spaceKey is required" }, 400);

    const { data: settings } = await supabase
      .from("user_settings")
      .select("confluence_base_url, confluence_email, confluence_api_token")
      .eq("user_id", user.id)
      .maybeSingle<{
        confluence_base_url: string | null;
        confluence_email: string | null;
        confluence_api_token: string | null;
      }>();

    if (
      !settings?.confluence_base_url ||
      !settings?.confluence_email ||
      !settings?.confluence_api_token
    ) {
      return jsonResponse(
        {
          error:
            "Confluence credentials not found. Please add your Confluence base URL, email, and API token in Settings.",
        },
        400
      );
    }

    const { data: report, error: reportError } = await supabase
      .from("visual_qa_reports")
      .select("id, title, design_source, design_image_url, design_figma_url, impl_image_url, status, summary, severity_counts, issues, created_at")
      .eq("id", reportId)
      .maybeSingle<ReportRow>();
    if (reportError || !report) return jsonResponse({ error: "Report not found" }, 404);
    if (report.status !== "complete") {
      return jsonResponse(
        { error: `Cannot publish: report status is "${report.status}". Only complete reports can be published.` },
        400
      );
    }

    const baseUrl = settings.confluence_base_url.replace(/\/+$/, "");
    const basicAuth = btoa(`${settings.confluence_email}:${settings.confluence_api_token}`);

    const designAttachment = "design.png";
    const implAttachment = "implementation.png";
    const html = renderConfluenceStorage(report, designAttachment, implAttachment);

    // Step 1 — create the page (v2 API).
    const createBody: Record<string, unknown> = {
      spaceId,
      status: "current",
      title: `Visual QA — ${report.title}`,
      body: { representation: "storage", value: html },
    };
    if (parentPageId) createBody.parentId = parentPageId;

    const createResp = await fetch(`${baseUrl}/wiki/api/v2/pages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createBody),
    });

    if (!createResp.ok) {
      const status = createResp.status;
      let errorMessage: string;
      try {
        const errorBody = await createResp.json();
        errorMessage = errorBody.message || errorBody.errorMessage || JSON.stringify(errorBody);
      } catch {
        errorMessage = await createResp.text();
      }
      if (status === 401) {
        return jsonResponse(
          { error: "Confluence authentication failed. Check email and API token in Settings." },
          401
        );
      }
      if (status === 404) {
        return jsonResponse({ error: "Confluence space not found. Check the Space ID." }, 404);
      }
      console.error("Confluence create error:", status, errorMessage);
      return jsonResponse({ error: `Confluence API error (${status}): ${errorMessage}` }, 502);
    }

    const created = await createResp.json();
    const pageId = created.id as string;
    const pageUrl = created._links?.webui
      ? `${baseUrl}/wiki${created._links.webui}`
      : `${baseUrl}/wiki/spaces/${spaceId}/pages/${pageId}`;

    // Step 2 — upload both images as attachments.
    try {
      const design = await downloadImage(report.design_image_url, authHeader);
      await uploadAttachment(baseUrl, basicAuth, pageId, design.blob, designAttachment);
      const impl = await downloadImage(report.impl_image_url, authHeader);
      await uploadAttachment(baseUrl, basicAuth, pageId, impl.blob, implAttachment);
    } catch (attachErr) {
      // Page is published but images may be missing — return the page anyway with a warning.
      const msg = attachErr instanceof Error ? attachErr.message : "Attachment upload failed";
      console.error("Attachment upload error:", attachErr);
      await supabase
        .from("visual_qa_reports")
        .update({
          confluence_page_id: pageId,
          confluence_page_url: pageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);
      return jsonResponse({
        pageId,
        pageUrl,
        warning: `Page created but image upload failed: ${msg}`,
      });
    }

    // Step 3 — persist on the report row.
    await supabase
      .from("visual_qa_reports")
      .update({
        confluence_page_id: pageId,
        confluence_page_url: pageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    return jsonResponse({ pageId, pageUrl });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ error: "Invalid request body" }, 400);
    }
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Visual QA publish error:", error);
    return jsonResponse({ error: msg }, 500);
  }
});
