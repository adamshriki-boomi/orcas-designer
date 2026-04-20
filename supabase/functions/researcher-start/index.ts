import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Validate the JWT against GoTrue directly. Using supabase.auth.getUser() fails with
    // sb_publishable_* anon keys — the SDK's getUser() path relies on an internal session
    // that's never populated when the JWT arrives via the global Authorization header.
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const authResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      },
    });

    if (!authResp.ok) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = (await authResp.json()) as { id: string };

    // Parse request body
    const body = await req.json();
    const { projectId } = body;

    // Validate projectId
    if (!projectId || typeof projectId !== "string") {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch project from DB
    const { data: project, error: projectError } = await supabase
      .from("researcher_projects")
      .select("id, status, user_id")
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

    // Validate project status
    if (project.status !== "draft" && project.status !== "failed") {
      return new Response(
        JSON.stringify({
          error: `Cannot start research: project status is "${project.status}". Only draft or failed projects can be started.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate job ID
    const jobId = crypto.randomUUID();

    // Update project status to running
    const { error: updateError } = await supabase
      .from("researcher_projects")
      .update({
        status: "running",
        started_at: new Date().toISOString(),
        job_id: jobId,
        error_message: null,
        progress: null,
        method_results: null,
        executive_summary: null,
        process_book: null,
        completed_at: null,
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Failed to update project:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update project status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trigger background execution via researcher-execute
    const executeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/researcher-execute`;

    EdgeRuntime.waitUntil(
      fetch(executeUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, jobId }),
      }).catch((err) => {
        console.error("Failed to trigger researcher-execute:", err);
      })
    );

    return new Response(
      JSON.stringify({ jobId }),
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
