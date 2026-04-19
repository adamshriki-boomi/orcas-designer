import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.90.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Built-in Research Methods (duplicated from src/lib/researcher-constants.ts) ──
// Edge functions can't import from the Next.js src/ directory.
// Only fields needed at runtime are included.

interface ResearchMethodDef {
  id: string;
  name: string;
  mode: "generative" | "analytical";
  description: string;
  outputFormat: string;
}

const BUILT_IN_RESEARCH_METHODS: ResearchMethodDef[] = [
  {
    id: "heuristic-evaluation",
    name: "Heuristic Evaluation",
    mode: "generative",
    description: "Systematic inspection of a UI against established usability principles (Nielsen's 10 Heuristics). Produces a severity-rated violation table with recommendations.",
    outputFormat: "Structured evaluation table with heuristic name, violation, severity (cosmetic/minor/major/catastrophic), location, and recommendation",
  },
  {
    id: "cognitive-walkthrough",
    name: "Cognitive Walkthrough",
    mode: "generative",
    description: "Evaluates learnability by stepping through tasks as a new user would. For each step, asks: \"Will the user know what to do? Will they notice the correct action? Will they understand the feedback?\"",
    outputFormat: "Step-by-step walkthrough document with pass/fail per step, confusion points, and recommendations",
  },
  {
    id: "accessibility-audit",
    name: "Accessibility Audit",
    mode: "generative",
    description: "Evaluates the design against WCAG guidelines and accessibility best practices. Covers color contrast, keyboard navigation, screen reader compatibility, and cognitive load.",
    outputFormat: "WCAG compliance checklist with specific violations, severity ratings, and prioritized remediation recommendations",
  },
  {
    id: "ia-review",
    name: "Information Architecture Review",
    mode: "generative",
    description: "Evaluates the organization, labeling, and navigation structure for findability and mental model alignment.",
    outputFormat: "IA audit with findings, labeling suggestions, and recommended restructuring",
  },
  {
    id: "usability-test-plan",
    name: "Usability Test Plan",
    mode: "generative",
    description: "Creates a complete usability testing plan ready to execute with real users, including screener, tasks, metrics, moderator script, and analysis framework.",
    outputFormat: "Complete test plan with screener questionnaire, task scenarios, success metrics (SUS, task completion rate), moderator guide, and debrief questions",
  },
  {
    id: "ux-metrics-framework",
    name: "UX Metrics Framework",
    mode: "generative",
    description: "Defines which metrics to track and how to measure UX success. Recommends KPIs, measurement approaches, benchmarks, and dashboard structure.",
    outputFormat: "Metrics framework with behavioral metrics, attitudinal metrics, custom metrics, measurement methodology, and suggested benchmarks",
  },
  {
    id: "persona-development",
    name: "Persona Development",
    mode: "generative",
    description: "Creates archetypal user profiles representing key audience segments with demographics, goals, frustrations, behaviors, tech proficiency, and scenarios.",
    outputFormat: "3-5 detailed persona documents with demographics, goals, pain points, behaviors, quotes, and scenarios",
  },
  {
    id: "user-journey-mapping",
    name: "User Journey Mapping",
    mode: "generative",
    description: "Visualizes the end-to-end experience across touchpoints, including user actions, thoughts, emotions, pain points, and opportunities at each stage.",
    outputFormat: "Structured journey map with stages (awareness through advocacy), actions, thoughts/emotions, pain points, opportunities, and touchpoints",
  },
  {
    id: "competitive-ux-analysis",
    name: "Competitive UX Analysis",
    mode: "generative",
    description: "Compares the product's UX against competitors on key dimensions: feature parity, interaction models, information architecture, and differentiation opportunities.",
    outputFormat: "Feature comparison matrix, UX pattern analysis, strengths/weaknesses per competitor, and strategic recommendations",
  },
  {
    id: "task-analysis",
    name: "Task Analysis",
    mode: "generative",
    description: "Breaks down user goals into subtasks and decision points. Identifies friction, unnecessary steps, and efficiency bottlenecks using Hierarchical Task Analysis.",
    outputFormat: "Hierarchical Task Analysis diagrams, task flow optimizations, step reduction recommendations",
  },
  {
    id: "research-plan",
    name: "Research Plan Generator",
    mode: "generative",
    description: "Produces a full research plan with timeline, methods justification, participant criteria, and activity sequence.",
    outputFormat: "Research plan with objectives, methods rationale, participant criteria, timeline, resource requirements, and activity sequence",
  },
  {
    id: "activity-protocol",
    name: "Activity Protocol Generator",
    mode: "generative",
    description: "Creates session scripts and moderator guides for conducting research with real participants.",
    outputFormat: "Session protocol with introduction script, task descriptions, probing questions, debrief guide, and note-taking template",
  },
  {
    id: "survey-analysis",
    name: "Survey Analysis",
    mode: "analytical",
    description: "Analyzes survey responses for patterns, sentiment, and actionable insights. Performs thematic analysis on open-ended responses and cross-tabulates quantitative data.",
    outputFormat: "Thematic analysis, sentiment distribution, key finding summaries, and recommended follow-up questions",
  },
  {
    id: "interview-analysis",
    name: "Interview/Session Analysis",
    mode: "analytical",
    description: "Analyzes interview transcripts or usability session notes. Performs affinity mapping, identifies recurring themes, extracts key quotes, and synthesizes findings.",
    outputFormat: "Affinity diagram themes, key quote bank, pattern frequency analysis, persona refinements, and actionable recommendations",
  },
  {
    id: "content-audit",
    name: "Content Audit",
    mode: "analytical",
    description: "Evaluates existing content quality, consistency, and alignment with user needs. Analyzes readability, tone, gaps, and redundancy.",
    outputFormat: "Content scorecard, gap analysis, readability scores, consolidation recommendations, and migration priority list",
  },
];

function getMethodById(id: string): ResearchMethodDef | undefined {
  return BUILT_IN_RESEARCH_METHODS.find((m) => m.id === id);
}

// ── Prompt Builders ──────────────────────────────────────────────

interface FormFieldData {
  inputType: 'url' | 'file' | 'text';
  urlValue: string;
  textValue: string;
  files: { id: string; name: string }[];
  additionalContext: string;
}

/** Extract a displayable string from a FormFieldData object (or a plain string for backward compat). */
function extractFieldText(field: FormFieldData | string | undefined): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (field.inputType === 'text' && field.textValue) return field.textValue;
  if (field.inputType === 'url' && field.urlValue) return field.urlValue;
  if (field.inputType === 'file' && field.files?.length > 0) {
    return `[${field.files.length} file${field.files.length > 1 ? 's' : ''}: ${field.files.map((f) => f.name).join(', ')}]`;
  }
  // Fallback: return whichever value is non-empty
  return field.textValue || field.urlValue || '';
}

interface ProjectConfig {
  productContext: {
    companyAdditionalContext: string;
    productInfo: FormFieldData | string;
    featureInfo: FormFieldData | string;
    additionalContext: FormFieldData | string;
  };
  researchPurpose: {
    title: string;
    description: string;
    goals: string[];
  };
  targetAudience: {
    description: string;
    segments: string[];
    existingPersonas: string;
  };
  successCriteria: {
    metric: string;
    target: string;
  }[];
  dataUpload: {
    files: { name: string; content?: string }[];
    textData: string;
  };
}

function buildMethodSystemPrompt(method: ResearchMethodDef): string {
  const frameworkGuidance = getFrameworkGuidance(method.id);

  return `You are an expert UX researcher conducting a "${method.name}" analysis.

## Your Task
${method.description}

## Framework & Approach
${frameworkGuidance}

## Expected Output Format
${method.outputFormat}

## Output Requirements
- Produce a well-structured markdown document
- Use clear headings (##, ###) to organize sections
- Include specific, actionable findings — not generic advice
- Where applicable, rate severity or priority of findings
- Tie recommendations back to the research context provided
- Be thorough but concise — aim for depth over breadth on each point`;
}

const FRAMEWORK_GUIDANCE: Record<string, string> = {
  "heuristic-evaluation": `Apply Jakob Nielsen's 10 Usability Heuristics:
1. Visibility of system status
2. Match between system and the real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

Rate each violation: Cosmetic (0), Minor (1), Major (2), Catastrophic (3).
Include the specific heuristic violated, the location in the UI, and a concrete recommendation.`,

  "cognitive-walkthrough": `For each task step, evaluate these four questions:
1. Will users try to achieve the right effect? (Goal formation)
2. Will users notice the correct action is available? (Action visibility)
3. Will users associate the correct action with the desired effect? (Action-effect mapping)
4. Will users understand the feedback after the action? (Feedback interpretation)

Mark each step as PASS or FAIL per question. Identify confusion points and provide specific remediation.`,

  "accessibility-audit": `Evaluate against WCAG 2.1 AA guidelines across these categories:
- Perceivable: Text alternatives, adaptable content, distinguishable elements
- Operable: Keyboard accessible, sufficient time, no seizure-inducing content, navigable
- Understandable: Readable, predictable, input assistance
- Robust: Compatible with assistive technologies

Rate issues by conformance level (A, AA, AAA) and impact severity.`,

  "ia-review": `Evaluate Information Architecture across:
- Organization schemes: How content is categorized and grouped
- Labeling systems: Terminology clarity and consistency
- Navigation systems: Wayfinding and movement between sections
- Search systems: Findability of content
- Mental model alignment: Does the structure match user expectations?

Use card sorting principles to suggest restructuring where needed.`,

  "usability-test-plan": `Create a complete test plan including:
- Study objectives and research questions
- Participant screener with inclusion/exclusion criteria
- Task scenarios (5-8 tasks with success criteria)
- Metrics: task completion rate, time on task, error rate, SUS score
- Moderator guide with probing questions
- Pre/post-test questionnaires
- Analysis framework and reporting template`,

  "ux-metrics-framework": `Define metrics using the HEART framework (Happiness, Engagement, Adoption, Retention, Task success) plus:
- Behavioral metrics: What users do (click-through rates, task completion, error rates)
- Attitudinal metrics: What users feel (NPS, SUS, CSAT)
- Custom metrics: Product-specific KPIs
- Measurement methodology: How to collect each metric
- Benchmarks: Industry standards and targets
- Dashboard structure: How to visualize and track over time`,

  "persona-development": `Create 3-5 distinct user personas, each including:
- Name, role, and demographic snapshot
- Goals and motivations (primary and secondary)
- Pain points and frustrations
- Behaviors and habits (technology usage patterns)
- A day-in-the-life scenario
- A representative quote
- Key needs from the product

Base personas on the target audience data provided. Make them specific and realistic, not generic archetypes.`,

  "user-journey-mapping": `Map the journey across these stages:
- Awareness: How users discover the product/feature
- Consideration: Evaluation and comparison
- Onboarding: First-time setup and learning
- Usage: Core task completion
- Retention: Ongoing engagement and habit formation
- Advocacy: Sharing and recommending

For each stage, document: user actions, thoughts, emotions (positive/negative), pain points, opportunities, and touchpoints.`,

  "competitive-ux-analysis": `Analyze competitors across these dimensions:
- Feature parity matrix: What exists vs. what's missing
- Interaction patterns: How key tasks are accomplished
- Information architecture: Navigation and content organization
- Visual design and branding: Look, feel, and consistency
- Onboarding experience: First-run and learning curve
- Unique differentiators: What each competitor does uniquely well

Conclude with strategic recommendations for differentiation.`,

  "task-analysis": `Use Hierarchical Task Analysis (HTA) to decompose tasks:
- Identify top-level user goals
- Break each goal into subtasks (2-4 levels deep)
- Document decision points and branching paths
- Measure complexity (number of steps, cognitive load)
- Identify friction points: unnecessary steps, confusing decisions, dead ends
- Recommend optimizations with estimated step reduction`,

  "research-plan": `Create a comprehensive research plan including:
- Research objectives and key questions
- Methods selection with justification for each
- Participant criteria (demographics, experience level, recruitment)
- Timeline with milestones (typically 4-8 weeks)
- Resource requirements (tools, budget, personnel)
- Activity sequence and dependencies
- Risk mitigation strategies
- Deliverables and reporting schedule`,

  "activity-protocol": `Create a detailed session protocol including:
- Introduction script (consent, recording, ground rules)
- Warm-up questions (5 min)
- Core task scenarios with probing questions
- Think-aloud instructions
- Follow-up and clarification prompts
- Debrief questions
- Note-taking template for observers
- Estimated timing per section`,

  "survey-analysis": `Analyze the provided survey data:
- Quantitative analysis: Response distributions, cross-tabulations, correlations
- Qualitative analysis: Thematic coding of open-ended responses
- Sentiment analysis: Overall and per-question sentiment
- Key findings: Top insights ranked by significance
- Segment analysis: Differences across user segments
- Recommended follow-up: Questions for deeper investigation`,

  "interview-analysis": `Analyze the provided interview/session data:
- Affinity mapping: Group related observations into themes
- Theme frequency: How often each theme appears across sessions
- Key quotes: Representative verbatim quotes per theme
- Pattern analysis: Behavioral patterns and mental models
- Persona refinements: How findings update existing personas
- Actionable recommendations: Prioritized by impact and frequency`,

  "content-audit": `Audit the provided content across:
- Quality: Accuracy, clarity, completeness, currency
- Consistency: Tone, terminology, formatting, structure
- Readability: Grade level, sentence complexity, jargon usage
- Gaps: Missing content, underserved user needs
- Redundancy: Duplicate or overlapping content
- Prioritized recommendations: What to fix, consolidate, or create`,
};

function getFrameworkGuidance(methodId: string): string {
  return FRAMEWORK_GUIDANCE[methodId]
    ?? "Follow established UX research best practices for this method. Structure your output clearly with headings and actionable findings.";
}

function getBuiltInSkillContentEdge(id: string): { name: string; content: string } | null {
  const method = BUILT_IN_RESEARCH_METHODS.find((m) => m.id === id);
  const framework = FRAMEWORK_GUIDANCE[id];
  if (!method || !framework) return null;
  const content = `# ${method.name}

## Purpose
${method.description}

## Framework & Approach
${framework}

## Expected Output
${method.outputFormat}

## Instructions
When invoked, produce a well-structured markdown document that follows the framework above. Use clear headings (##, ###), include specific and actionable findings, rate severity or priority where applicable, and tie recommendations back to the research context provided by the researcher.`;
  return { name: method.name, content };
}

function buildMethodUserMessage(
  method: ResearchMethodDef,
  config: ProjectConfig,
  skillsContent: string,
  memoriesContent: string,
): string {
  const parts: string[] = [];

  // Research context
  parts.push(`## Research Context
- **Research title**: ${config.researchPurpose.title}
- **Research description**: ${config.researchPurpose.description}
- **Goals**: ${config.researchPurpose.goals.length > 0 ? config.researchPurpose.goals.map((g, i) => `\n  ${i + 1}. ${g}`).join("") : "Not specified"}`);

  // Success criteria
  if (config.successCriteria.length > 0) {
    parts.push(`## Success Criteria
${config.successCriteria.map((sc) => `- **${sc.metric}**: ${sc.target}`).join("\n")}`);
  }

  // Product context
  const companyText = config.productContext.companyAdditionalContext || "Not specified";
  const productText = extractFieldText(config.productContext.productInfo) || "Not specified";
  const featureText = extractFieldText(config.productContext.featureInfo) || "Not specified";
  const additionalCtxText = extractFieldText(config.productContext.additionalContext);
  parts.push(`## Product Context
- **Company**: ${companyText}
- **Product**: ${productText}
- **Feature/Area**: ${featureText}
${additionalCtxText ? `- **Additional context**: ${additionalCtxText}` : ""}`);

  // Target audience
  parts.push(`## Target Audience
- **Description**: ${config.targetAudience.description || "Not specified"}
- **Segments**: ${config.targetAudience.segments.length > 0 ? config.targetAudience.segments.join(", ") : "Not specified"}
${config.targetAudience.existingPersonas ? `- **Existing personas**: ${config.targetAudience.existingPersonas}` : ""}`);

  // Data upload (for analytical methods)
  if (method.mode === "analytical") {
    if (config.dataUpload.textData) {
      parts.push(`## Uploaded Data
${config.dataUpload.textData}`);
    }
    if (config.dataUpload.files.length > 0) {
      const fileContents = config.dataUpload.files
        .filter((f) => f.content)
        .map((f) => `### File: ${f.name}\n${f.content}`)
        .join("\n\n");
      if (fileContents) {
        parts.push(`## Uploaded Files
${fileContents}`);
      }
    }
  }

  // Skills and memories
  if (skillsContent) {
    parts.push(`## Additional Skills/Guidelines
${skillsContent}`);
  }
  if (memoriesContent) {
    parts.push(`## Additional Context (Memories)
${memoriesContent}`);
  }

  parts.push(`\nPlease conduct a thorough "${method.name}" analysis based on the context above. Produce a detailed, well-structured markdown document.`);

  return parts.join("\n\n");
}

function buildSynthesisSystemPrompt(): string {
  return `You are a senior UX research director synthesizing findings from a multi-method research project.

You will be given the results from several research methods that were applied to the same product/feature.

You must produce TWO sections:

## 1. Executive Summary
A concise synthesis (500-800 words) that:
- Identifies the most critical findings across all methods
- Highlights patterns and themes that appeared in multiple methods
- Prioritizes the top 5-7 actionable recommendations
- Notes any conflicting findings between methods and how to reconcile them
- Provides a clear "what to do next" section

## 2. Process Book
A comprehensive research journey document (1500-3000 words) that:
- Describes the research approach and rationale for each method
- Summarizes key findings from each method with cross-references
- Documents the analytical process and how conclusions were drawn
- Provides a complete recommendation roadmap with priority tiers
- Includes a methodology reflection: what worked well, what could improve

Format your response as JSON:
{
  "executive_summary": "markdown string",
  "process_book": "markdown string"
}

Return ONLY valid JSON, no markdown fences or extra text.`;
}

// ── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // This function is called internally by researcher-start — verify service role key
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: internal function only" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey
  );

  let projectId: string | undefined;

  try {
    // Parse request body
    const body = await req.json();
    projectId = body.projectId;
    const jobId = body.jobId;

    if (!projectId || !jobId) {
      return new Response(
        JSON.stringify({ error: "projectId and jobId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch project from DB
    const { data: project, error: projectError } = await supabase
      .from("researcher_projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !project) {
      console.error("Failed to fetch project:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify job ID matches (prevent duplicate/stale executions)
    if (project.job_id !== jobId) {
      console.warn(`Job ID mismatch: expected ${project.job_id}, got ${jobId}`);
      return new Response(
        JSON.stringify({ error: "Job ID mismatch — this execution is stale" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's Claude API key
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("claude_api_key")
      .eq("user_id", project.user_id)
      .maybeSingle();

    if (settingsError || !settings?.claude_api_key) {
      await markFailed(supabase, projectId, "Claude API key not found. Please add your API key in Settings.");
      return new Response(
        JSON.stringify({ error: "Claude API key not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropic = new Anthropic({ apiKey: settings.claude_api_key });
    const config = project.config as ProjectConfig;
    const selectedMethodIds: string[] = project.selected_method_ids || [];

    // Load skills and memories content for prompt enrichment
    const skillsContent = await loadSkillsContent(
      supabase,
      project.selected_shared_skill_ids || [],
      project.custom_skills || []
    );
    const memoriesContent = await loadMemoriesContent(
      supabase,
      project.selected_shared_memory_ids || [],
      project.custom_memories || []
    );

    // Process each method sequentially
    const methodResults: Record<string, MethodResult> = {};
    const completedMethods: string[] = [];

    for (let i = 0; i < selectedMethodIds.length; i++) {
      const methodId = selectedMethodIds[i];
      const method = getMethodById(methodId);

      if (!method) {
        methodResults[methodId] = {
          methodId,
          title: methodId,
          content: "",
          thinkingTokensUsed: 0,
          completedAt: new Date().toISOString(),
          error: `Unknown method: ${methodId}`,
        };
        completedMethods.push(methodId);
        continue;
      }

      // Update progress
      await supabase
        .from("researcher_projects")
        .update({
          progress: {
            currentMethod: methodId,
            completedMethods: [...completedMethods],
            totalMethods: selectedMethodIds.length,
          },
        })
        .eq("id", projectId);

      try {
        const systemPrompt = buildMethodSystemPrompt(method);
        const userMessage = buildMethodUserMessage(method, config, skillsContent, memoriesContent);

        // Claude Opus 4.7 with maximum extended thinking:
        // - `thinking: {type: "adaptive"}` replaces the deprecated `budget_tokens` knob on 4.7
        //   (Opus 4.7 returns 400 if `budget_tokens` is sent). Adaptive lets Claude decide
        //   thinking depth per request and auto-enables interleaved thinking between tools.
        // - `output_config.effort: "max"` is Opus-tier only and dials thinking/compute to max.
        // - `max_tokens: 16000` stays under SDK HTTP timeouts for non-streaming requests.
        //   (Opus 4.7 supports up to 128K, but values that large require streaming.)
        // No beta headers are needed — 1M context, adaptive thinking, and effort are all GA on Opus 4.7.
        const message = await anthropic.messages.create({
          model: "claude-opus-4-7",
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          output_config: { effort: "max" },
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        });

        // Extract text response
        const textBlock = message.content.find(
          (block: Anthropic.ContentBlock) => block.type === "text"
        );
        const thinkingBlock = message.content.find(
          (block: Anthropic.ContentBlock) => block.type === "thinking"
        );

        const thinkingTokens = thinkingBlock && "thinking" in thinkingBlock
          ? (message.usage as { thinking_tokens?: number })?.thinking_tokens ?? 0
          : 0;

        methodResults[methodId] = {
          methodId,
          title: method.name,
          content: textBlock && textBlock.type === "text" ? textBlock.text : "",
          thinkingTokensUsed: thinkingTokens,
          completedAt: new Date().toISOString(),
          error: null,
        };
      } catch (methodError: unknown) {
        console.error(`Error processing method ${methodId}:`, methodError);

        const errorMessage = methodError instanceof Anthropic.AuthenticationError
          ? "Invalid Claude API key"
          : methodError instanceof Anthropic.RateLimitError
            ? "Rate limit exceeded — try again later"
            : methodError instanceof Anthropic.APIError
              ? `Claude API error: ${(methodError as Anthropic.APIError).message}`
              : methodError instanceof Error
                ? methodError.message
                : "Unknown error";

        methodResults[methodId] = {
          methodId,
          title: method?.name ?? methodId,
          content: "",
          thinkingTokensUsed: 0,
          completedAt: new Date().toISOString(),
          error: errorMessage,
        };

        // If it's an auth error, stop processing — all subsequent calls will fail too
        if (methodError instanceof Anthropic.AuthenticationError) {
          await markFailed(supabase, projectId, "Invalid Claude API key. Please check your key in Settings.");
          return new Response(
            JSON.stringify({ error: "Invalid Claude API key" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      completedMethods.push(methodId);

      // Write intermediate results to DB after each method
      await supabase
        .from("researcher_projects")
        .update({
          method_results: methodResults,
          progress: {
            currentMethod: methodId,
            completedMethods: [...completedMethods],
            totalMethods: selectedMethodIds.length,
          },
        })
        .eq("id", projectId);
    }

    // ── Synthesis: Generate executive summary and process book ──
    const successfulResults = Object.values(methodResults).filter((r) => !r.error);

    let executiveSummary = "";
    let processBook = "";

    if (successfulResults.length > 0) {
      try {
        const synthesisInput = successfulResults
          .map((r) => `# ${r.title}\n\n${r.content}`)
          .join("\n\n---\n\n");

        // Synthesis uses the same Opus 4.7 + adaptive thinking + max effort config as the
        // per-method calls. See the per-method `anthropic.messages.create` call above for
        // a detailed explanation of why `thinking: {type: "adaptive"}` and `effort: "max"`
        // are the correct choices for maximum extended thinking on Opus 4.7.
        const synthesisMessage = await anthropic.messages.create({
          model: "claude-opus-4-7",
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          output_config: { effort: "max" },
          system: buildSynthesisSystemPrompt(),
          messages: [
            {
              role: "user",
              content: `Here are the research method results to synthesize:\n\n${synthesisInput}`,
            },
          ],
        });

        const synthesisTextBlock = synthesisMessage.content.find(
          (block: Anthropic.ContentBlock) => block.type === "text"
        );

        if (synthesisTextBlock && synthesisTextBlock.type === "text") {
          // Strip markdown fences if Claude wrapped the JSON
          let rawSynthesis = synthesisTextBlock.text.trim();
          if (rawSynthesis.startsWith("```")) {
            rawSynthesis = rawSynthesis.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          }
          const parsed = JSON.parse(rawSynthesis);
          executiveSummary = parsed.executive_summary || "";
          processBook = parsed.process_book || "";
        }
      } catch (synthesisError) {
        console.error("Failed to generate synthesis:", synthesisError);
        // Non-fatal — we still have the individual method results
        executiveSummary = "Synthesis could not be generated. Please review individual method results.";
        processBook = "";
      }
    }

    // ── Mark completed ──
    await supabase
      .from("researcher_projects")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        executive_summary: executiveSummary,
        process_book: processBook,
        method_results: methodResults,
        progress: {
          currentMethod: null,
          completedMethods,
          totalMethods: selectedMethodIds.length,
        },
      })
      .eq("id", projectId);

    // ── Try to send completion notification ──
    try {
      const notifyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/researcher-notify`;
      await fetch(notifyUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, userId: project.user_id }),
      });
    } catch (notifyError) {
      console.error("Failed to send notification:", notifyError);
      // Non-fatal
    }

    return new Response(
      JSON.stringify({ success: true, completedMethods }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Unrecoverable error in researcher-execute:", error);

    if (projectId) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      await markFailed(supabase, projectId, errorMessage);
    }

    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Helpers ──────────────────────────────────────────────────────

interface MethodResult {
  methodId: string;
  title: string;
  content: string;
  thinkingTokensUsed: number;
  completedAt: string;
  error: string | null;
}

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
  errorMessage: string
): Promise<void> {
  try {
    await supabase
      .from("researcher_projects")
      .update({
        status: "failed",
        error_message: errorMessage,
        progress: null,
      })
      .eq("id", projectId);
  } catch (e) {
    console.error("Failed to mark project as failed:", e);
  }
}

async function loadSkillsContent(
  supabase: ReturnType<typeof createClient>,
  sharedSkillIds: string[],
  customSkills: { name: string; content: string }[]
): Promise<string> {
  const parts: string[] = [];

  const builtInHits: { name: string; content: string }[] = [];
  const dbIds: string[] = [];
  for (const id of sharedSkillIds) {
    const bi = getBuiltInSkillContentEdge(id);
    if (bi) {
      builtInHits.push(bi);
    } else {
      dbIds.push(id);
    }
  }

  for (const bi of builtInHits) {
    parts.push(`### ${bi.name}\n${bi.content}`);
  }

  if (dbIds.length > 0) {
    const { data: skills } = await supabase
      .from("shared_skills")
      .select("name, url_value, file_content")
      .in("id", dbIds);

    if (skills) {
      for (const skill of skills) {
        if (skill.url_value) {
          parts.push(`### ${skill.name}\nURL: ${skill.url_value}`);
        } else if (skill.file_content) {
          const content = typeof skill.file_content === "string"
            ? skill.file_content
            : JSON.stringify(skill.file_content);
          parts.push(`### ${skill.name}\n${content}`);
        }
      }
    }
  }

  // Add custom skills
  for (const skill of customSkills) {
    if (skill.content) {
      parts.push(`### ${skill.name}\n${skill.content}`);
    }
  }

  return parts.join("\n\n");
}

async function loadMemoriesContent(
  supabase: ReturnType<typeof createClient>,
  sharedMemoryIds: string[],
  customMemories: { name: string; content: string }[]
): Promise<string> {
  const parts: string[] = [];

  // Load shared memories
  if (sharedMemoryIds.length > 0) {
    const { data: memories } = await supabase
      .from("shared_memories")
      .select("name, content")
      .in("id", sharedMemoryIds);

    if (memories) {
      for (const memory of memories) {
        if (memory.content) {
          parts.push(`### ${memory.name}\n${memory.content}`);
        }
      }
    }
  }

  // Add custom memories
  for (const memory of customMemories) {
    if (memory.content) {
      parts.push(`### ${memory.name}\n${memory.content}`);
    }
  }

  return parts.join("\n\n");
}
