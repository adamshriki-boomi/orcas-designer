import type { BuiltInResearchMethod } from './researcher-types';
import { BUILT_IN_RESEARCH_METHODS } from './researcher-constants';

export interface BuiltInSkill {
  id: string;
  name: string;
  category: string;
  tags: string[];
  description: string;
  content: string;
  icon: string;
}

// Framework guidance per method — same text used by the Researcher Edge Function's getFrameworkGuidance.
// Kept in sync with supabase/functions/researcher-execute/index.ts. The parity test in
// `built-in-skills.test.ts` reads the Edge Function source at test time and asserts every
// entry in this map appears byte-for-byte in the Edge Function file, so drift will fail CI.
export const FRAMEWORK_GUIDANCE: Record<string, string> = {
  'heuristic-evaluation': `Apply Jakob Nielsen's 10 Usability Heuristics:
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

  'cognitive-walkthrough': `For each task step, evaluate these four questions:
1. Will users try to achieve the right effect? (Goal formation)
2. Will users notice the correct action is available? (Action visibility)
3. Will users associate the correct action with the desired effect? (Action-effect mapping)
4. Will users understand the feedback after the action? (Feedback interpretation)

Mark each step as PASS or FAIL per question. Identify confusion points and provide specific remediation.`,

  'accessibility-audit': `Evaluate against WCAG 2.1 AA guidelines across these categories:
- Perceivable: Text alternatives, adaptable content, distinguishable elements
- Operable: Keyboard accessible, sufficient time, no seizure-inducing content, navigable
- Understandable: Readable, predictable, input assistance
- Robust: Compatible with assistive technologies

Rate issues by conformance level (A, AA, AAA) and impact severity.`,

  'ia-review': `Evaluate Information Architecture across:
- Organization schemes: How content is categorized and grouped
- Labeling systems: Terminology clarity and consistency
- Navigation systems: Wayfinding and movement between sections
- Search systems: Findability of content
- Mental model alignment: Does the structure match user expectations?

Use card sorting principles to suggest restructuring where needed.`,

  'usability-test-plan': `Create a complete test plan including:
- Study objectives and research questions
- Participant screener with inclusion/exclusion criteria
- Task scenarios (5-8 tasks with success criteria)
- Metrics: task completion rate, time on task, error rate, SUS score
- Moderator guide with probing questions
- Pre/post-test questionnaires
- Analysis framework and reporting template`,

  'ux-metrics-framework': `Define metrics using the HEART framework (Happiness, Engagement, Adoption, Retention, Task success) plus:
- Behavioral metrics: What users do (click-through rates, task completion, error rates)
- Attitudinal metrics: What users feel (NPS, SUS, CSAT)
- Custom metrics: Product-specific KPIs
- Measurement methodology: How to collect each metric
- Benchmarks: Industry standards and targets
- Dashboard structure: How to visualize and track over time`,

  'persona-development': `Create 3-5 distinct user personas, each including:
- Name, role, and demographic snapshot
- Goals and motivations (primary and secondary)
- Pain points and frustrations
- Behaviors and habits (technology usage patterns)
- A day-in-the-life scenario
- A representative quote
- Key needs from the product

Base personas on the target audience data provided. Make them specific and realistic, not generic archetypes.`,

  'user-journey-mapping': `Map the journey across these stages:
- Awareness: How users discover the product/feature
- Consideration: Evaluation and comparison
- Onboarding: First-time setup and learning
- Usage: Core task completion
- Retention: Ongoing engagement and habit formation
- Advocacy: Sharing and recommending

For each stage, document: user actions, thoughts, emotions (positive/negative), pain points, opportunities, and touchpoints.`,

  'competitive-ux-analysis': `Analyze competitors across these dimensions:
- Feature parity matrix: What exists vs. what's missing
- Interaction patterns: How key tasks are accomplished
- Information architecture: Navigation and content organization
- Visual design and branding: Look, feel, and consistency
- Onboarding experience: First-run and learning curve
- Unique differentiators: What each competitor does uniquely well

Conclude with strategic recommendations for differentiation.`,

  'task-analysis': `Use Hierarchical Task Analysis (HTA) to decompose tasks:
- Identify top-level user goals
- Break each goal into subtasks (2-4 levels deep)
- Document decision points and branching paths
- Measure complexity (number of steps, cognitive load)
- Identify friction points: unnecessary steps, confusing decisions, dead ends
- Recommend optimizations with estimated step reduction`,

  'research-plan': `Create a comprehensive research plan including:
- Research objectives and key questions
- Methods selection with justification for each
- Participant criteria (demographics, experience level, recruitment)
- Timeline with milestones (typically 4-8 weeks)
- Resource requirements (tools, budget, personnel)
- Activity sequence and dependencies
- Risk mitigation strategies
- Deliverables and reporting schedule`,

  'activity-protocol': `Create a detailed session protocol including:
- Introduction script (consent, recording, ground rules)
- Warm-up questions (5 min)
- Core task scenarios with probing questions
- Think-aloud instructions
- Follow-up and clarification prompts
- Debrief questions
- Note-taking template for observers
- Estimated timing per section`,

  'survey-analysis': `Analyze the provided survey data:
- Quantitative analysis: Response distributions, cross-tabulations, correlations
- Qualitative analysis: Thematic coding of open-ended responses
- Sentiment analysis: Overall and per-question sentiment
- Key findings: Top insights ranked by significance
- Segment analysis: Differences across user segments
- Recommended follow-up: Questions for deeper investigation`,

  'interview-analysis': `Analyze the provided interview/session data:
- Affinity mapping: Group related observations into themes
- Theme frequency: How often each theme appears across sessions
- Key quotes: Representative verbatim quotes per theme
- Pattern analysis: Behavioral patterns and mental models
- Persona refinements: How findings update existing personas
- Actionable recommendations: Prioritized by impact and frequency`,

  'content-audit': `Audit the provided content across:
- Quality: Accuracy, clarity, completeness, currency
- Consistency: Tone, terminology, formatting, structure
- Readability: Grade level, sentence complexity, jargon usage
- Gaps: Missing content, underserved user needs
- Redundancy: Duplicate or overlapping content
- Prioritized recommendations: What to fix, consolidate, or create`,
};

function buildContent(method: BuiltInResearchMethod): string {
  const guidance = FRAMEWORK_GUIDANCE[method.id];
  if (!guidance) {
    throw new Error(
      `[built-in-skills] No FRAMEWORK_GUIDANCE entry for method ID "${method.id}". ` +
      `Add an entry to FRAMEWORK_GUIDANCE before adding a new research method.`
    );
  }

  return `# ${method.name}

## Purpose
${method.description}

## Framework & Approach
${guidance}

## Expected Output
${method.outputFormat}

## Instructions
When invoked, produce a well-structured markdown document that follows the framework above. Use clear headings (##, ###), include specific and actionable findings, rate severity or priority where applicable, and tie recommendations back to the research context provided by the researcher.`;
}

export const BUILT_IN_SKILLS: BuiltInSkill[] = BUILT_IN_RESEARCH_METHODS.map((method) => ({
  id: method.id,
  name: method.name,
  category: 'UX Research',
  tags: [],
  description: method.description,
  content: buildContent(method),
  icon: method.icon,
}));

export function getBuiltInSkillById(id: string): BuiltInSkill | null {
  return BUILT_IN_SKILLS.find((s) => s.id === id) ?? null;
}
