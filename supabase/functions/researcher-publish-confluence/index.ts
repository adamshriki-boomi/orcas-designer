import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Markdown-to-Confluence Storage Format converter ────────────────

function markdownToConfluence(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockLines: string[] = [];
  let inList = false;
  let inTable = false;
  let tableRows: string[][] = [];

  let listTag = "ul";
  function flushList() {
    if (inList) {
      output.push(`</${listTag}>`);
      inList = false;
    }
  }

  function flushTable() {
    if (inTable && tableRows.length > 0) {
      output.push("<table><tbody>");
      for (let i = 0; i < tableRows.length; i++) {
        const cells = tableRows[i];
        // Skip separator rows (e.g. |---|---|)
        if (cells.every((c) => /^[-:]+$/.test(c.trim()))) continue;
        const tag = i === 0 ? "th" : "td";
        output.push(
          "<tr>" + cells.map((c) => `<${tag}>${inlineFormat(c.trim())}</${tag}>`).join("") + "</tr>"
        );
      }
      output.push("</tbody></table>");
      tableRows = [];
      inTable = false;
    }
  }

  function inlineFormat(text: string): string {
    // Bold: **text** or __text__
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
    // Italic: *text* or _text_
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    text = text.replace(/_(.+?)_/g, "<em>$1</em>");
    // Inline code: `text`
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        codeBlockLines = [];
      } else {
        const codeContent = codeBlockLines.join("\n");
        output.push(
          `<ac:structured-macro ac:name="code">` +
            (codeBlockLang
              ? `<ac:parameter ac:name="language">${codeBlockLang}</ac:parameter>`
              : "") +
            `<ac:plain-text-body><![CDATA[${codeContent}]]></ac:plain-text-body>` +
            `</ac:structured-macro>`
        );
        inCodeBlock = false;
        codeBlockLang = "";
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Empty line — flush lists/tables, skip
    if (line.trim() === "") {
      flushList();
      flushTable();
      continue;
    }

    // Table row: | cell | cell |
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList();
      if (!inTable) inTable = true;
      const cells = line
        .trim()
        .slice(1, -1) // remove leading/trailing |
        .split("|");
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      output.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Unordered list item
    if (/^\s*[-*+]\s+/.test(line)) {
      flushTable();
      if (!inList) {
        listTag = "ul";
        output.push("<ul>");
        inList = true;
      }
      const text = line.replace(/^\s*[-*+]\s+/, "");
      output.push(`<li>${inlineFormat(text)}</li>`);
      continue;
    }

    // Ordered list item
    if (/^\s*\d+\.\s+/.test(line)) {
      flushTable();
      if (!inList) {
        listTag = "ol";
        output.push("<ol>");
        inList = true;
      }
      const text = line.replace(/^\s*\d+\.\s+/, "");
      output.push(`<li>${inlineFormat(text)}</li>`);
      continue;
    }

    // Paragraph
    flushList();
    output.push(`<p>${inlineFormat(line)}</p>`);
  }

  flushList();
  flushTable();

  return output.join("\n");
}

// ── Main handler ───────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate via Supabase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { projectId, spaceKey } = body;

    if (!projectId || typeof projectId !== "string") {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!spaceKey || typeof spaceKey !== "string") {
      return new Response(
        JSON.stringify({ error: "spaceKey is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's Confluence credentials from user_settings
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("confluence_base_url, confluence_email, confluence_api_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) {
      console.error("Failed to fetch user settings:", settingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (
      !settings?.confluence_base_url ||
      !settings?.confluence_email ||
      !settings?.confluence_api_token
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Confluence credentials not found. Please add your Confluence base URL, email, and API token in Settings.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { confluence_base_url, confluence_email, confluence_api_token } = settings;

    // Fetch the researcher project
    const { data: project, error: projectError } = await supabase
      .from("researcher_projects")
      .select("id, name, status, executive_summary, method_results, process_book")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Failed to fetch project:", projectError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch project" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (project.status !== "completed") {
      return new Response(
        JSON.stringify({
          error: `Cannot publish: project status is "${project.status}". Only completed projects can be published to Confluence.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the Confluence page body
    const sections: string[] = [];

    // Executive Summary
    if (project.executive_summary) {
      sections.push("<h1>Executive Summary</h1>");
      sections.push(markdownToConfluence(project.executive_summary));
    }

    // Method Results
    const methodResults = project.method_results as Record<
      string,
      { title: string; content: string }
    > | null;

    if (methodResults) {
      sections.push("<h1>Research Results</h1>");
      for (const [, result] of Object.entries(methodResults)) {
        sections.push(`<h2>${result.title}</h2>`);
        sections.push(markdownToConfluence(result.content));
      }
    }

    // Process Book
    if (project.process_book) {
      sections.push("<h1>Process Book</h1>");
      sections.push(markdownToConfluence(project.process_book));
    }

    const htmlContent = sections.join("\n");

    // Call Confluence REST API v2 to create a page
    const confluenceUrl = `${confluence_base_url.replace(/\/+$/, "")}/wiki/api/v2/pages`;
    const basicAuth = btoa(`${confluence_email}:${confluence_api_token}`);

    const confluenceResponse = await fetch(confluenceUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        spaceId: spaceKey,
        status: "current",
        title: `UX Research: ${project.name}`,
        body: {
          representation: "storage",
          value: htmlContent,
        },
      }),
    });

    if (!confluenceResponse.ok) {
      const status = confluenceResponse.status;
      let errorMessage: string;

      try {
        const errorBody = await confluenceResponse.json();
        errorMessage = errorBody.message || errorBody.errorMessage || JSON.stringify(errorBody);
      } catch {
        errorMessage = await confluenceResponse.text();
      }

      if (status === 401) {
        return new Response(
          JSON.stringify({
            error: "Confluence authentication failed. Please check your email and API token in Settings.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (status === 404) {
        return new Response(
          JSON.stringify({
            error: "Confluence space not found. Please check the Space ID.",
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.error("Confluence API error:", status, errorMessage);
      return new Response(
        JSON.stringify({
          error: `Confluence API error (${status}): ${errorMessage}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const confluenceResult = await confluenceResponse.json();
    const pageId = confluenceResult.id;
    const pageUrl =
      confluenceResult._links?.webui
        ? `${confluence_base_url.replace(/\/+$/, "")}/wiki${confluenceResult._links.webui}`
        : `${confluence_base_url.replace(/\/+$/, "")}/wiki/spaces/${spaceKey}/pages/${pageId}`;

    // Store confluence_page_id and confluence_page_url on the project row
    const { error: updateError } = await supabase
      .from("researcher_projects")
      .update({
        confluence_page_id: pageId,
        confluence_page_url: pageUrl,
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Failed to update project with Confluence page info:", updateError);
      // Don't fail the whole request — the page was created successfully
    }

    return new Response(
      JSON.stringify({ pageId, pageUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
