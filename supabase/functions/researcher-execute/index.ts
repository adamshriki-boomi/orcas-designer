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

You MUST produce TWO sections separated by the exact delimiter line \`<<<SECTION BREAK>>>\` on its own line. Do NOT wrap in JSON. Do NOT use any markdown code fences. Respond with plain markdown only.

═══════════════════════════════════════════════════════════════
SECTION 1 — Executive Summary (500-800 words)
═══════════════════════════════════════════════════════════════

Write for a busy product designer or PM who needs actionable insights in 2 minutes. Use clear, direct language — no academic jargon, no filler. The summary MUST include these headings, in this order:

## TL;DR
3-4 sentences capturing the most important finding and the single most critical next step.

## Top Action Items
A numbered list of 5-7 concrete, prioritized actions. Each item follows this exact pattern:

**[Priority: P0 | P1 | P2]** *(Impact: High | Medium | Low)* — Short imperative title

- **What to do:** concrete action (1-2 sentences)
- **Why:** which finding drives this (reference specific method + severity)
- **Owner hint:** who is likely to own it (Design / Eng / PM / Research)

Priority legend: P0 = blocks users now, P1 = notable friction, P2 = polish.

## Key Themes
3-5 patterns that appeared across multiple methods. Each theme: one bold title + one tight sentence. Cross-reference the methods the theme came from.

## Open Questions / Conflicts
Any findings that contradict each other across methods, or any gaps that need follow-up research. If none, write "No material conflicts — findings were internally consistent."

## What to Do Next
One short paragraph (3-5 sentences) giving the team a clear starting move this week.

═══════════════════════════════════════════════════════════════
SECTION 2 — Process Book (1200-2000 words)
═══════════════════════════════════════════════════════════════

A researcher-facing narrative that documents the study for future reference. Include:

## Research Approach
Why these methods were chosen for this product/feature. One paragraph.

## Method-by-Method Findings
For each method provided: its name as a heading, 3-5 bullet takeaways in plain language, and one explicit cross-reference to related findings in other methods where relevant.

## Synthesis Narrative
2-3 paragraphs describing how you pieced together themes across methods, what surprised you, what was reinforced, and what required judgement calls.

## Recommendation Roadmap
A short table or bulleted list grouping actions by horizon:
- **Now (this sprint):** …
- **Next (1-2 sprints):** …
- **Later (next quarter+):** …

## Methodology Reflection
One paragraph on what worked well in this research design and what could be strengthened if the same study were run again.

═══════════════════════════════════════════════════════════════
FORMAT RULES
═══════════════════════════════════════════════════════════════

1. Return PLAIN MARKDOWN only. No JSON. No code fences wrapping the response. No preamble.
2. Put the exact delimiter line \`<<<SECTION BREAK>>>\` — on its own line, nothing else on that line — between the Executive Summary and the Process Book. Use it exactly once.
3. Use markdown headings (## and ###), bold, and lists. Do NOT use HTML.
4. Write in active voice, second-person or direct language. No "it should be noted that…" filler.
5. Be specific. Prefer concrete references to findings (e.g. "Heuristic Evaluation flagged 3 major violations on the export flow") over generic statements.`;
}

// ── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Internal-only: verify service role key
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: internal function only" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let projectId: string | undefined;
  let jobId: string | undefined;
  try {
    const body = await req.json();
    projectId = body.projectId;
    jobId = body.jobId;

    if (!projectId || !jobId) {
      return new Response(
        JSON.stringify({ error: "projectId and jobId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Return 202 immediately; run the step in the background
  EdgeRuntime.waitUntil(processNextStep(projectId!, jobId!));

  return new Response(
    JSON.stringify({ status: "processing", projectId, jobId }),
    { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

async function processNextStep(projectId: string, jobId: string): Promise<void> {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  try {
    // 1. Load project
    const { data: project, error: projectError } = await supabase
      .from("researcher_projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !project) {
      console.error(`[${projectId}] Failed to fetch project:`, projectError);
      return;
    }

    if (project.job_id !== jobId) {
      console.warn(`[${projectId}] Job ID mismatch (expected ${project.job_id}, got ${jobId}). Stale invocation — skipping.`);
      return;
    }

    if (project.status !== "running") {
      console.warn(`[${projectId}] Status is ${project.status}, not running — skipping.`);
      return;
    }

    // 2. Load API key
    const { data: settings } = await supabase
      .from("user_settings")
      .select("claude_api_key")
      .eq("user_id", project.user_id)
      .maybeSingle();

    if (!settings?.claude_api_key) {
      await markFailed(supabase, projectId, "Claude API key not found. Please add your API key in Settings.");
      return;
    }

    const anthropic = new Anthropic({ apiKey: settings.claude_api_key });
    const selectedMethodIds: string[] = project.selected_method_ids || [];
    const methodResults = (project.method_results || {}) as Record<string, MethodResult>;

    // 3. Determine next step
    const nextMethodId = selectedMethodIds.find((id) => !(id in methodResults));

    if (nextMethodId) {
      // 3a. Run the next pending method
      await runOneMethod(supabase, anthropic, project, nextMethodId, methodResults, selectedMethodIds);
      // Fire self for next step
      await fireSelfInvocation(projectId, jobId);
      return;
    }

    // 3b. All methods done — run synthesis (if not done) then mark completed
    await runSynthesisAndComplete(supabase, anthropic, project, methodResults, selectedMethodIds);

    // 3c. Fire-and-forget notification — never let notify failure tank the run
    await fireNotification(projectId, project.user_id);
  } catch (error: unknown) {
    console.error(`[${projectId}] Unrecoverable error in processNextStep:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    await markFailed(supabase, projectId, errorMessage);
  }
}

async function runOneMethod(
  supabase: ReturnType<typeof createClient>,
  anthropic: Anthropic,
  project: Record<string, unknown>,
  methodId: string,
  methodResults: Record<string, MethodResult>,
  selectedMethodIds: string[],
): Promise<void> {
  const projectId = project.id as string;
  const config = project.config as ProjectConfig;
  const method = getMethodById(methodId);

  // Update progress.currentMethod to the one we're about to run
  const currentCompletedMethods = selectedMethodIds.filter((id) => id in methodResults);
  await supabase
    .from("researcher_projects")
    .update({
      progress: {
        currentMethod: methodId,
        completedMethods: [...currentCompletedMethods],
        totalMethods: selectedMethodIds.length,
      },
    })
    .eq("id", projectId);

  if (!method) {
    methodResults[methodId] = {
      methodId,
      title: methodId,
      content: "",
      thinkingTokensUsed: 0,
      completedAt: new Date().toISOString(),
      error: `Unknown method: ${methodId}`,
    };
  } else {
    try {
      const skillsContent = await loadSkillsContent(
        supabase,
        (project.selected_shared_skill_ids as string[]) || [],
        (project.custom_skills as { name: string; content: string }[]) || [],
      );
      const memoriesContent = await loadMemoriesContent(
        supabase,
        (project.selected_shared_memory_ids as string[]) || [],
        (project.custom_memories as { name: string; content: string }[]) || [],
      );

      const systemPrompt = buildMethodSystemPrompt(method);
      const userMessage = buildMethodUserMessage(method, config, skillsContent, memoriesContent);

      const message = await anthropic.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "max" },
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

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
      console.error(`[${projectId}] Error processing method ${methodId}:`, methodError);

      // Auth error is terminal — mark the whole project failed
      if (methodError instanceof Anthropic.AuthenticationError) {
        await markFailed(supabase, projectId, "Invalid Claude API key. Please check your key in Settings.");
        throw methodError; // propagate so processNextStep's catch marks failed (redundant but safe)
      }

      const errorMessage = methodError instanceof Anthropic.RateLimitError
        ? "Rate limit exceeded — try again later"
        : methodError instanceof Anthropic.APIError
          ? `Claude API error: ${(methodError as Anthropic.APIError).message}`
          : methodError instanceof Error
            ? methodError.message
            : "Unknown error";

      methodResults[methodId] = {
        methodId,
        title: method.name,
        content: "",
        thinkingTokensUsed: 0,
        completedAt: new Date().toISOString(),
        error: errorMessage,
      };
    }
  }

  // Persist updated method_results and completedMethods
  const completedMethods = selectedMethodIds.filter((id) => id in methodResults);
  await supabase
    .from("researcher_projects")
    .update({
      method_results: methodResults,
      progress: {
        currentMethod: null,
        completedMethods,
        totalMethods: selectedMethodIds.length,
      },
    })
    .eq("id", projectId);
}

async function runSynthesisAndComplete(
  supabase: ReturnType<typeof createClient>,
  anthropic: Anthropic,
  project: Record<string, unknown>,
  methodResults: Record<string, MethodResult>,
  selectedMethodIds: string[],
): Promise<void> {
  const projectId = project.id as string;
  const successfulResults = Object.values(methodResults).filter((r) => !r.error);

  let executiveSummary = "";
  let processBook = "";

  const alreadyHasSynthesis = (project.executive_summary as string | null) && (project.executive_summary as string).length > 0;

  if (!alreadyHasSynthesis && successfulResults.length > 0) {
    try {
      const synthesisInput = successfulResults
        .map((r) => `# ${r.title}\n\n${r.content}`)
        .join("\n\n---\n\n");

      // Synthesis runs in its own Edge Function invocation (one step per invocation),
      // so it has a full ~400s wall-clock budget. Opus 4.7 + adaptive thinking, 8K max
      // tokens for the combined exec-summary + process-book output, 300s app-level abort
      // as a final safety net. Output is plain markdown with a sentinel delimiter between
      // the two sections — much more robust to parse than JSON, which was silently
      // failing when the model emitted unescaped quotes or got truncated mid-string.
      const synthesisAbort = new AbortController();
      const synthesisTimeoutId = setTimeout(() => synthesisAbort.abort(), 300_000);
      let synthesisMessage;
      try {
        synthesisMessage = await anthropic.messages.create(
          {
            model: "claude-opus-4-7",
            max_tokens: 8000,
            thinking: { type: "adaptive" },
            system: buildSynthesisSystemPrompt(),
            messages: [
              {
                role: "user",
                content: `Here are the research method results to synthesize:\n\n${synthesisInput}`,
              },
            ],
          },
          { signal: synthesisAbort.signal },
        );
      } finally {
        clearTimeout(synthesisTimeoutId);
      }

      const synthesisTextBlock = synthesisMessage.content.find(
        (block: Anthropic.ContentBlock) => block.type === "text"
      );

      if (!synthesisTextBlock || synthesisTextBlock.type !== "text") {
        console.error(`[${projectId}] Synthesis returned no text block. Content blocks:`,
          synthesisMessage.content.map((b: Anthropic.ContentBlock) => b.type).join(","));
        throw new Error("Synthesis response contained no text block");
      }

      let raw = synthesisTextBlock.text.trim();
      // Strip any accidental code fences the model added against our instructions
      if (raw.startsWith("```")) {
        raw = raw.replace(/^```(?:markdown|md)?\n?/, "").replace(/\n?```$/, "");
      }

      const SECTION_DELIM = /^\s*<<<SECTION BREAK>>>\s*$/m;
      const parts = raw.split(SECTION_DELIM);
      if (parts.length >= 2) {
        executiveSummary = parts[0].trim();
        processBook = parts.slice(1).join("\n\n<<<SECTION BREAK>>>\n\n").trim();
      } else {
        // Model didn't emit the delimiter — still salvage by treating the whole response
        // as the executive summary. This is graceful degradation, not a failure.
        console.warn(`[${projectId}] Synthesis output missing <<<SECTION BREAK>>> delimiter — treating as exec-summary-only. Length: ${raw.length}`);
        executiveSummary = raw;
        processBook = "";
      }

      // Validate: exec summary is the critical deliverable. If it somehow came back empty,
      // treat the whole synthesis as failed so the catch branch runs (logs full response,
      // shows user a clear fallback).
      if (executiveSummary.length < 100) {
        console.error(`[${projectId}] Synthesis produced suspiciously short executive summary (${executiveSummary.length} chars). First 200 chars of raw response:`, raw.slice(0, 200));
        throw new Error(`Executive summary too short (${executiveSummary.length} chars)`);
      }

      const usage = (synthesisMessage.usage as Record<string, unknown>) || {};
      console.log(`[${projectId}] Synthesis OK. exec_chars=${executiveSummary.length} book_chars=${processBook.length} input_tokens=${usage.input_tokens} output_tokens=${usage.output_tokens}`);
    } catch (synthesisError) {
      const errMsg = synthesisError instanceof Error ? synthesisError.message : String(synthesisError);
      console.error(`[${projectId}] Failed to generate synthesis:`, errMsg, synthesisError);
      executiveSummary = `# Synthesis unavailable\n\nThe AI synthesis step failed with: ${errMsg}\n\nThe individual method results are still available under the **Methods** tab. Please retry the research run from the project page to attempt synthesis again.`;
      processBook = "";
    }
  }

  // Mark completed — use existing values if synthesis was already done this isn't re-running
  if (alreadyHasSynthesis) {
    executiveSummary = project.executive_summary as string;
    processBook = (project.process_book as string | null) ?? "";
  }

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
        completedMethods: selectedMethodIds.filter((id) => id in methodResults),
        totalMethods: selectedMethodIds.length,
      },
    })
    .eq("id", projectId);
}

async function fireSelfInvocation(projectId: string, jobId: string): Promise<void> {
  const selfUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/researcher-execute`;
  try {
    // Don't await the response body — we just need to trigger the next invocation
    const resp = await fetch(selfUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectId, jobId }),
    });
    // Log non-2xx — don't throw, self fired a stale/bad request but the run is otherwise fine
    if (!resp.ok) {
      console.error(`[${projectId}] Self-invocation returned ${resp.status}: ${await resp.text().catch(() => "<unreadable>")}`);
    }
  } catch (err) {
    console.error(`[${projectId}] Failed to fire self-invocation:`, err);
  }
}

async function fireNotification(projectId: string, userId: string): Promise<void> {
  const notifyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/researcher-notify`;
  try {
    await fetch(notifyUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectId, userId }),
    });
  } catch (err) {
    console.error(`[${projectId}] Failed to send notification:`, err);
  }
}

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
