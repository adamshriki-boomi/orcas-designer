import type { BuiltInResearchMethod, ResearchProjectType } from './researcher-types';

// ── Built-in Research Methods ───────────────────────────────────

export const BUILT_IN_RESEARCH_METHODS: BuiltInResearchMethod[] = [
  // Generative mode — Evaluative project type
  {
    id: 'heuristic-evaluation',
    name: 'Heuristic Evaluation',
    mode: 'generative',
    projectTypes: ['evaluative'],
    description: 'Systematic inspection of a UI against established usability principles (Nielsen\'s 10 Heuristics). Produces a severity-rated violation table with recommendations.',
    shortDescription: 'Evaluate UI against usability heuristics',
    requiredInputs: ['productContext'],
    outputFormat: 'Structured evaluation table with heuristic name, violation, severity (cosmetic/minor/major/catastrophic), location, and recommendation',
    icon: 'ClipboardCheck',
  },
  {
    id: 'cognitive-walkthrough',
    name: 'Cognitive Walkthrough',
    mode: 'generative',
    projectTypes: ['evaluative'],
    description: 'Evaluates learnability by stepping through tasks as a new user would. For each step, asks: "Will the user know what to do? Will they notice the correct action? Will they understand the feedback?"',
    shortDescription: 'Assess task learnability step-by-step',
    requiredInputs: ['productContext', 'targetAudience'],
    outputFormat: 'Step-by-step walkthrough document with pass/fail per step, confusion points, and recommendations',
    icon: 'Footprints',
  },
  {
    id: 'accessibility-audit',
    name: 'Accessibility Audit',
    mode: 'generative',
    projectTypes: ['evaluative'],
    description: 'Evaluates the design against WCAG guidelines and accessibility best practices. Covers color contrast, keyboard navigation, screen reader compatibility, and cognitive load.',
    shortDescription: 'WCAG compliance audit with remediation',
    requiredInputs: ['productContext'],
    outputFormat: 'WCAG compliance checklist with specific violations, severity ratings, and prioritized remediation recommendations',
    icon: 'Accessibility',
  },
  {
    id: 'ia-review',
    name: 'Information Architecture Review',
    mode: 'generative',
    projectTypes: ['evaluative'],
    description: 'Evaluates the organization, labeling, and navigation structure for findability and mental model alignment.',
    shortDescription: 'Audit navigation and content organization',
    requiredInputs: ['productContext'],
    outputFormat: 'IA audit with findings, labeling suggestions, and recommended restructuring',
    icon: 'Network',
  },
  {
    id: 'usability-test-plan',
    name: 'Usability Test Plan',
    mode: 'generative',
    projectTypes: ['evaluative'],
    description: 'Creates a complete usability testing plan ready to execute with real users, including screener, tasks, metrics, moderator script, and analysis framework.',
    shortDescription: 'Generate ready-to-execute test protocol',
    requiredInputs: ['productContext', 'targetAudience'],
    outputFormat: 'Complete test plan with screener questionnaire, task scenarios, success metrics (SUS, task completion rate), moderator guide, and debrief questions',
    icon: 'ListChecks',
  },
  {
    id: 'ux-metrics-framework',
    name: 'UX Metrics Framework',
    mode: 'generative',
    projectTypes: ['evaluative'],
    description: 'Defines which metrics to track and how to measure UX success. Recommends KPIs, measurement approaches, benchmarks, and dashboard structure.',
    shortDescription: 'Define KPIs and measurement methodology',
    requiredInputs: ['productContext'],
    outputFormat: 'Metrics framework with behavioral metrics, attitudinal metrics, custom metrics, measurement methodology, and suggested benchmarks',
    icon: 'BarChart3',
  },

  // Generative mode — Exploratory / Generative project types
  {
    id: 'persona-development',
    name: 'Persona Development',
    mode: 'generative',
    projectTypes: ['exploratory', 'generative'],
    description: 'Creates archetypal user profiles representing key audience segments with demographics, goals, frustrations, behaviors, tech proficiency, and scenarios.',
    shortDescription: 'Create detailed user personas',
    requiredInputs: ['targetAudience'],
    outputFormat: '3-5 detailed persona documents with demographics, goals, pain points, behaviors, quotes, and scenarios',
    icon: 'Users',
  },
  {
    id: 'user-journey-mapping',
    name: 'User Journey Mapping',
    mode: 'generative',
    projectTypes: ['exploratory', 'generative'],
    description: 'Visualizes the end-to-end experience across touchpoints, including user actions, thoughts, emotions, pain points, and opportunities at each stage.',
    shortDescription: 'Map end-to-end user experience',
    requiredInputs: ['productContext', 'targetAudience'],
    outputFormat: 'Structured journey map with stages (awareness through advocacy), actions, thoughts/emotions, pain points, opportunities, and touchpoints',
    icon: 'Route',
  },

  // Generative mode — Cross-type
  {
    id: 'competitive-ux-analysis',
    name: 'Competitive UX Analysis',
    mode: 'generative',
    projectTypes: ['exploratory', 'evaluative'],
    description: 'Compares the product\'s UX against competitors on key dimensions: feature parity, interaction models, information architecture, and differentiation opportunities.',
    shortDescription: 'Analyze competitor UX patterns',
    requiredInputs: ['productContext'],
    outputFormat: 'Feature comparison matrix, UX pattern analysis, strengths/weaknesses per competitor, and strategic recommendations',
    icon: 'GitCompareArrows',
  },
  {
    id: 'task-analysis',
    name: 'Task Analysis',
    mode: 'generative',
    projectTypes: ['exploratory', 'evaluative'],
    description: 'Breaks down user goals into subtasks and decision points. Identifies friction, unnecessary steps, and efficiency bottlenecks using Hierarchical Task Analysis.',
    shortDescription: 'Decompose user tasks and find friction',
    requiredInputs: ['productContext', 'targetAudience'],
    outputFormat: 'Hierarchical Task Analysis diagrams, task flow optimizations, step reduction recommendations',
    icon: 'GitBranch',
  },

  // Generative mode — Universal (all project types)
  {
    id: 'research-plan',
    name: 'Research Plan Generator',
    mode: 'generative',
    projectTypes: ['exploratory', 'generative', 'evaluative'],
    description: 'Produces a full research plan with timeline, methods justification, participant criteria, and activity sequence. Maps to Boomi\'s "Plan activities" process step.',
    shortDescription: 'Generate complete research plan',
    requiredInputs: ['productContext', 'targetAudience'],
    outputFormat: 'Research plan with objectives, methods rationale, participant criteria, timeline, resource requirements, and activity sequence',
    icon: 'CalendarRange',
  },
  {
    id: 'activity-protocol',
    name: 'Activity Protocol Generator',
    mode: 'generative',
    projectTypes: ['exploratory', 'generative', 'evaluative'],
    description: 'Creates session scripts and moderator guides for conducting research with real participants. Maps to Boomi\'s "Conduct activities" process step.',
    shortDescription: 'Create session scripts and guides',
    requiredInputs: ['productContext', 'targetAudience'],
    outputFormat: 'Session protocol with introduction script, task descriptions, probing questions, debrief guide, and note-taking template',
    icon: 'FileText',
  },

  // Analytical mode — Require user data
  {
    id: 'survey-analysis',
    name: 'Survey Analysis',
    mode: 'analytical',
    projectTypes: ['evaluative'],
    description: 'Analyzes survey responses for patterns, sentiment, and actionable insights. Performs thematic analysis on open-ended responses and cross-tabulates quantitative data.',
    shortDescription: 'Analyze survey response patterns',
    requiredInputs: ['dataUpload'],
    outputFormat: 'Thematic analysis, sentiment distribution, key finding summaries, and recommended follow-up questions',
    icon: 'PieChart',
  },
  {
    id: 'interview-analysis',
    name: 'Interview/Session Analysis',
    mode: 'analytical',
    projectTypes: ['exploratory'],
    description: 'Analyzes interview transcripts or usability session notes. Performs affinity mapping, identifies recurring themes, extracts key quotes, and synthesizes findings.',
    shortDescription: 'Synthesize interview themes and patterns',
    requiredInputs: ['dataUpload'],
    outputFormat: 'Affinity diagram themes, key quote bank, pattern frequency analysis, persona refinements, and actionable recommendations',
    icon: 'MessageSquareText',
  },
  {
    id: 'content-audit',
    name: 'Content Audit',
    mode: 'analytical',
    projectTypes: ['evaluative'],
    description: 'Evaluates existing content quality, consistency, and alignment with user needs. Analyzes readability, tone, gaps, and redundancy.',
    shortDescription: 'Audit content quality and gaps',
    requiredInputs: ['dataUpload'],
    outputFormat: 'Content scorecard, gap analysis, readability scores, consolidation recommendations, and migration priority list',
    icon: 'FileSearch',
  },
];

// ── Method Filtering ────────────────────────────────────────────

export function getMethodsForProjectType(projectType: ResearchProjectType): BuiltInResearchMethod[] {
  return BUILT_IN_RESEARCH_METHODS.filter(m => m.projectTypes.includes(projectType));
}

export function getMethodById(id: string): BuiltInResearchMethod | undefined {
  return BUILT_IN_RESEARCH_METHODS.find(m => m.id === id);
}

// ── Wizard Steps ────────────────────────────────────────────────

export const RESEARCHER_WIZARD_STEPS = [
  { key: 'research-type', label: 'Research Type', required: true },
  { key: 'product-context', label: 'Product Context', required: true },
  { key: 'research-purpose', label: 'Research Goals', required: true },
  { key: 'target-audience', label: 'Target Audience', required: true },
  { key: 'success-criteria', label: 'Success Criteria', required: false },
  { key: 'method-selection', label: 'Research Methods', required: true },
  { key: 'data-upload', label: 'Data Upload', required: false },
  { key: 'skills-memories', label: 'Skills & Memories', required: false },
  { key: 'review-run', label: 'Review & Run', required: false },
] as const;

export const RESEARCHER_TOTAL_STEPS = RESEARCHER_WIZARD_STEPS.length;

export const RESEARCHER_STEP_GROUPS = [
  { label: 'Context', range: [0, 3] as const },
  { label: 'Research Setup', range: [4, 6] as const },
  { label: 'Configuration', range: [7, 8] as const },
];

// ── Research Type Descriptions ──────────────────────────────────

export const RESEARCH_TYPE_INFO: Record<ResearchProjectType, { label: string; description: string }> = {
  exploratory: {
    label: 'Exploratory',
    description: 'Discover themes and patterns from observing people. Broader, open-ended. Best for understanding the "why" behind behavior.',
  },
  generative: {
    label: 'Generative',
    description: 'Creative, co-creative methods to generate varied concepts. Best for ideation and concept development.',
  },
  evaluative: {
    label: 'Evaluative',
    description: 'Evaluate the usefulness, usability, or desirability of a product or concept. Most structured and straightforward.',
  },
};
