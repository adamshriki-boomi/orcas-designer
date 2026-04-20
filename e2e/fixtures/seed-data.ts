export const TEST_USER = {
  id: 'test-user-uuid-0000-0000-0000-000000000001',
  email: 'test@boomi.com',
  full_name: 'Test User',
};

export const TEST_SESSION = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: {
    id: TEST_USER.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: TEST_USER.email,
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    phone: '',
    confirmed_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: TEST_USER.full_name, email: TEST_USER.email },
    identities: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: new Date().toISOString(),
  },
};

export type SeedData = {
  prompts: Array<Record<string, unknown>>;
  prompt_versions: Array<Record<string, unknown>>;
  researcher_projects: Array<Record<string, unknown>>;
  ux_writer_analyses: Array<Record<string, unknown>>;
  shared_skills: Array<Record<string, unknown>>;
  shared_memories: Array<Record<string, unknown>>;
  user_settings: Array<Record<string, unknown>>;
  profiles: Array<Record<string, unknown>>;
};

export function emptySeed(): SeedData {
  return {
    prompts: [],
    prompt_versions: [],
    researcher_projects: [],
    ux_writer_analyses: [],
    shared_skills: [],
    shared_memories: [],
    user_settings: [
      {
        id: 'settings-1',
        user_id: TEST_USER.id,
        claude_api_key: 'sk-ant-test-fake-key',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
    profiles: [
      {
        id: TEST_USER.id,
        email: TEST_USER.email,
        full_name: TEST_USER.full_name,
        avatar_url: '',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

const emptyFormField = () => ({
  inputType: 'url',
  urlValue: '',
  textValue: '',
  files: [],
  additionalContext: '',
});

const emptyPromptData = () => ({
  companyInfo: emptyFormField(),
  productInfo: emptyFormField(),
  featureInfo: emptyFormField(),
  currentImplementation: { ...emptyFormField(), figmaLinks: [], implementationMode: 'add-on-top' },
  uxResearch: emptyFormField(),
  uxWriting: emptyFormField(),
  figmaFileLink: emptyFormField(),
  designSystemStorybook: emptyFormField(),
  designSystemNpm: { ...emptyFormField(), inputType: 'text' },
  designSystemFigma: emptyFormField(),
  prototypeSketches: emptyFormField(),
});

const emptyResearchConfig = () => ({
  productContext: {
    companyAdditionalContext: '',
    productInfo: emptyFormField(),
    featureInfo: emptyFormField(),
    additionalContext: emptyFormField(),
  },
  researchPurpose: {
    title: '',
    description: '',
    goals: [],
  },
  targetAudience: {
    description: '',
    segments: [],
    existingPersonas: '',
  },
  successCriteria: [],
  dataUpload: {
    files: [],
    textData: '',
  },
});

export function populatedSeed(): SeedData {
  const seed = emptySeed();
  const now = new Date();
  const iso = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  seed.prompts = [
    {
      id: 'prompt-1',
      user_id: TEST_USER.id,
      name: 'Checkout redesign',
      data: emptyPromptData(),
      accessibility_level: 'wcag-aa',
      browser_compatibility: ['chrome'],
      prompt_mode: 'comprehensive',
      design_direction: null,
      external_resources_accessible: true,
      output_directory: './output/',
      regeneration_count: 2,
      generated_prompt: '',
      selected_shared_skill_ids: [],
      custom_skills: [],
      selected_shared_memory_ids: ['built-in-company-context'],
      custom_memories: [],
      created_at: iso(5),
      updated_at: iso(1),
    },
    {
      id: 'prompt-2',
      user_id: TEST_USER.id,
      name: 'Landing page rebuild',
      data: emptyPromptData(),
      accessibility_level: 'none',
      browser_compatibility: ['chrome', 'firefox'],
      prompt_mode: 'comprehensive',
      design_direction: null,
      external_resources_accessible: true,
      output_directory: './output/',
      regeneration_count: 0,
      generated_prompt: '',
      selected_shared_skill_ids: [],
      custom_skills: [],
      selected_shared_memory_ids: ['built-in-company-context'],
      custom_memories: [],
      created_at: iso(20),
      updated_at: iso(18),
    },
  ];

  // Prompt-1 has two completed AI-authored versions + one legacy template v1.
  seed.prompt_versions = [
    {
      id: 'version-legacy-1',
      prompt_id: 'prompt-1',
      user_id: TEST_USER.id,
      version_number: 1,
      status: 'completed',
      content: '# Legacy template output for Checkout',
      wizard_snapshot: {},
      context_snapshot: null,
      model: 'legacy-template',
      input_tokens: null,
      output_tokens: null,
      thinking_enabled: false,
      label: 'Legacy (template)',
      error_message: null,
      created_at: iso(5),
      completed_at: iso(5),
    },
    {
      id: 'version-ai-1',
      prompt_id: 'prompt-1',
      user_id: TEST_USER.id,
      version_number: 2,
      status: 'completed',
      content: '# Claude Code Brief — Checkout redesign\n\n<context>\n...\n</context>',
      wizard_snapshot: { Feature: 'Streamlined checkout' },
      context_snapshot: {},
      model: 'claude-opus-4-7',
      input_tokens: 2100,
      output_tokens: 12400,
      thinking_enabled: true,
      label: null,
      error_message: null,
      created_at: iso(1),
      completed_at: iso(1),
    },
  ];

  seed.researcher_projects = [
    {
      id: 'research-running-1',
      user_id: TEST_USER.id,
      name: 'Persona study',
      status: 'running',
      research_type: 'exploratory',
      config: emptyResearchConfig(),
      selected_method_ids: ['persona-development', 'user-journey-mapping'],
      selected_shared_skill_ids: [],
      custom_skills: [],
      selected_shared_memory_ids: [],
      custom_memories: [],
      job_id: 'job-1',
      started_at: iso(0),
      completed_at: null,
      error_message: null,
      progress: {
        currentMethod: 'user-journey-mapping',
        completedMethods: ['persona-development'],
        totalMethods: 2,
      },
      framing_document: null,
      executive_summary: null,
      process_book: null,
      method_results: null,
      confluence_page_id: null,
      confluence_page_url: null,
      created_at: iso(0),
      updated_at: iso(0),
    },
    {
      id: 'research-completed-1',
      user_id: TEST_USER.id,
      name: 'Checkout heuristic evaluation',
      status: 'completed',
      research_type: 'evaluative',
      config: emptyResearchConfig(),
      selected_method_ids: ['heuristic-evaluation'],
      selected_shared_skill_ids: [],
      custom_skills: [],
      selected_shared_memory_ids: [],
      custom_memories: [],
      job_id: 'job-2',
      started_at: iso(10),
      completed_at: iso(10),
      error_message: null,
      progress: null,
      framing_document: '# Framing',
      executive_summary: '# Summary',
      process_book: '# Process',
      method_results: {},
      confluence_page_id: null,
      confluence_page_url: null,
      created_at: iso(12),
      updated_at: iso(10),
    },
  ];

  seed.ux_writer_analyses = [
    {
      id: 'ux-1',
      user_id: TEST_USER.id,
      name: 'Settings page copy review',
      description: 'Review settings page labels',
      focus_notes: null,
      screenshot_url: null,
      include_ai_voice: false,
      results: null,
      created_at: iso(3),
      updated_at: iso(3),
    },
  ];

  seed.shared_skills = [
    {
      id: 'skill-1',
      name: 'Component library',
      description: 'Use the Boomi Exosphere design system',
      type: 'url',
      url_value: 'https://exosphere.boomi.com',
      file_content: null,
      created_by: TEST_USER.id,
      created_at: iso(30),
      updated_at: iso(30),
    },
  ];

  seed.shared_memories = [
    {
      id: 'built-in-company-context',
      name: 'Boomi Context',
      description: 'Built-in company context',
      content: '# Boomi\n\nIntegration platform',
      file_name: 'boomi-context.md',
      is_built_in: true,
      category: 'Company',
      tags: [],
      created_by: null,
      created_at: iso(60),
      updated_at: iso(60),
    },
  ];

  return seed;
}
