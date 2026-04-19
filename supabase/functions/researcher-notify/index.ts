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

  // Verify service role key — internal function only
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: internal function only" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    // Parse request body
    const body = await req.json();
    const { projectId, userId } = body;

    if (!projectId || !userId) {
      return new Response(
        JSON.stringify({ error: "projectId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user email from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to fetch profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch project name
    const { data: project, error: projectError } = await supabase
      .from("researcher_projects")
      .select("name")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Failed to fetch project:", projectError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch project" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const projectName = project?.name ?? "Unknown Project";
    const userEmail = profile.email;

    // Placeholder: log notification (actual email integration will be added later)
    console.log(`[researcher-notify] Research "${projectName}" completed for ${userEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
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
