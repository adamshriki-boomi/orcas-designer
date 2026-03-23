export type SkillIncludeCondition =
  | 'always'
  | 'hasFigma'
  | 'hasSourceFigma'
  | 'hasDesignFigma'
  | 'isAddOnTop'
  | 'never';

export interface MandatorySkill {
  name: string;
  category: string;
  description: string;
  invocation: string;
  repoUrl: string;
  includeCondition: SkillIncludeCondition;
}

const MARKETPLACE_REPO = 'https://github.com/anthropics/claude-plugins-official';
const ATLASSIAN_REPO = 'https://github.com/atlassian/atlassian-mcp-server';

export const MANDATORY_SKILLS: MandatorySkill[] = [
  // Design
  { name: 'frontend-design', category: 'Design', description: 'Create distinctive, production-grade frontend interfaces', invocation: '/frontend-design', repoUrl: MARKETPLACE_REPO, includeCondition: 'always' },
  { name: 'ui-ux-pro-max', category: 'Design', description: 'Advanced UI/UX design patterns and best practices', invocation: '/ui-ux-pro-max', repoUrl: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill', includeCondition: 'never' },
  { name: 'screenshot-overlay-positioning', category: 'Design', description: 'Position HTML/CSS overlays on product screenshots', invocation: '/screenshot-overlay-positioning', repoUrl: MARKETPLACE_REPO, includeCondition: 'isAddOnTop' },

  // Superpowers
  { name: 'brainstorming', category: 'Superpowers', description: 'Explore user intent, requirements and design before implementation', invocation: '/brainstorming', repoUrl: MARKETPLACE_REPO, includeCondition: 'always' },
  { name: 'writing-plans', category: 'Superpowers', description: 'Create detailed implementation plans from specs', invocation: '/writing-plans', repoUrl: MARKETPLACE_REPO, includeCondition: 'always' },
  { name: 'subagent-driven-development', category: 'Superpowers', description: 'Execute plans with independent parallel tasks', invocation: '/subagent-driven-development', repoUrl: MARKETPLACE_REPO, includeCondition: 'never' },
  { name: 'executing-plans', category: 'Superpowers', description: 'Execute implementation plans with review checkpoints', invocation: '/executing-plans', repoUrl: MARKETPLACE_REPO, includeCondition: 'always' },
  { name: 'systematic-debugging', category: 'Superpowers', description: 'Systematic approach to debugging issues', invocation: '/systematic-debugging', repoUrl: MARKETPLACE_REPO, includeCondition: 'never' },
  { name: 'verification-before-completion', category: 'Superpowers', description: 'Verify work before claiming completion', invocation: '/verification-before-completion', repoUrl: MARKETPLACE_REPO, includeCondition: 'always' },
  { name: 'finishing-a-development-branch', category: 'Superpowers', description: 'Complete development work with merge/PR options', invocation: '/finishing-a-development-branch', repoUrl: MARKETPLACE_REPO, includeCondition: 'always' },
  { name: 'using-git-worktrees', category: 'Superpowers', description: 'Isolated git worktrees for feature work', invocation: '/using-git-worktrees', repoUrl: MARKETPLACE_REPO, includeCondition: 'never' },
  { name: 'requesting-code-review', category: 'Superpowers', description: 'Request code review after completing work', invocation: '/requesting-code-review', repoUrl: MARKETPLACE_REPO, includeCondition: 'never' },
  { name: 'receiving-code-review', category: 'Superpowers', description: 'Handle code review feedback with rigor', invocation: '/receiving-code-review', repoUrl: MARKETPLACE_REPO, includeCondition: 'never' },
  { name: 'dispatching-parallel-agents', category: 'Superpowers', description: 'Dispatch parallel agents for independent tasks', invocation: '/dispatching-parallel-agents', repoUrl: MARKETPLACE_REPO, includeCondition: 'always' },

  // Figma
  { name: 'implement-design', category: 'Figma', description: 'Translate Figma designs into production-ready code', invocation: '/implement-design', repoUrl: MARKETPLACE_REPO, includeCondition: 'hasSourceFigma' },
  { name: 'create-design-system-rules', category: 'Figma', description: 'Generate custom design system rules', invocation: '/create-design-system-rules', repoUrl: MARKETPLACE_REPO, includeCondition: 'hasSourceFigma' },
  { name: 'code-connect-components', category: 'Figma', description: 'Connect Figma components to code via Code Connect', invocation: '/code-connect-components', repoUrl: MARKETPLACE_REPO, includeCondition: 'hasDesignFigma' },

  // Atlassian
  { name: 'search-company-knowledge', category: 'Atlassian', description: 'Search Confluence and Jira for internal info', invocation: '/search-company-knowledge', repoUrl: ATLASSIAN_REPO, includeCondition: 'never' },
  { name: 'triage-issue', category: 'Atlassian', description: 'Triage bug reports and find duplicates', invocation: '/triage-issue', repoUrl: ATLASSIAN_REPO, includeCondition: 'never' },
  { name: 'generate-status-report', category: 'Atlassian', description: 'Generate project status reports', invocation: '/generate-status-report', repoUrl: ATLASSIAN_REPO, includeCondition: 'never' },
  { name: 'spec-to-backlog', category: 'Atlassian', description: 'Convert specs into Jira backlogs', invocation: '/spec-to-backlog', repoUrl: ATLASSIAN_REPO, includeCondition: 'never' },
  { name: 'capture-tasks-from-meeting-notes', category: 'Atlassian', description: 'Extract action items from meeting notes', invocation: '/capture-tasks-from-meeting-notes', repoUrl: ATLASSIAN_REPO, includeCondition: 'never' },

  // Claude Management
  { name: 'claude-md-improver', category: 'Claude Management', description: 'Audit and improve CLAUDE.md files', invocation: '/claude-md-improver', repoUrl: MARKETPLACE_REPO, includeCondition: 'never' },
  { name: 'revise-claude-md', category: 'Claude Management', description: 'Update CLAUDE.md with session learnings', invocation: '/revise-claude-md', repoUrl: MARKETPLACE_REPO, includeCondition: 'never' },

  // Meta
  { name: 'skill-creator', category: 'Meta', description: 'Create, modify, and test skills', invocation: '/skill-creator', repoUrl: MARKETPLACE_REPO, includeCondition: 'never' },
];

export const SKILL_CATEGORIES = [...new Set(MANDATORY_SKILLS.map(s => s.category))];

export const BUILT_IN_COMPANY_CONTEXT = `# Boomi Company Context (Summary)

## Identity
- **Company:** Boomi, LP | "Connect everything to achieve anything."
- **Founded:** 2000, HQ in Conshohocken, PA
- **Ownership:** Francisco Partners & TPG Capital (acquired from Dell in 2021, $4B)
- **CEO:** Steve Lucas | **COO:** Valerie Rainey
- **Employees:** ~1,900+ | **Customers:** 30,000+
- **Category:** iPaaS, AI-Driven Automation

## Platform Products
1. **Integration & Automation** - drag-and-drop process builder, 1,500+ connectors, Boomi Suggest (300M+ crowdsourced mappings)
2. **API Management** - full lifecycle, federated multi-gateway (API Control Plane), MCP server endpoints
3. **Data Management** - Data Hub (MDM/golden records), **Boomi Data Integration** (ELT/CDC, from Rivery acquisition)
4. **Boomi Flow** - low-code app/workflow builder
5. **Event Streams** - real-time pub/sub messaging
6. **B2B/EDI Management** - trading partner management
7. **Task Automation** - no-code for business users
8. **Managed File Transfer (MFT)** - via Thru Inc. acquisition
9. **Agentstudio** - AI agent lifecycle management (GA May 2025)

## Key Technical Details
- Single-instance, multi-tenant architecture
- Hybrid deployment: cloud, on-prem, edge
- Runtime: Java 11 based (Atom, Molecule, Atom Cloud)
- MCP support throughout platform
- Low-code first, pro-code supported

## Design Principles
- Low-code/no-code visual drag-and-drop interface
- Vendor-agnostic
- Enterprise-grade security
- Crowdsourced intelligence as competitive moat

## Boomi Data Integration (Feature Focus)
- Formerly Rivery (acquired Dec 2024)
- ELT/CDC data pipeline service
- Modern data integration capabilities`;

export const BUILT_IN_PRODUCT_CONTEXT = `# Boomi Data Integration (formerly Rivery) - Product Context

## Identity
- Originally Rivery Technologies Ltd (founded 2017, Israel)
- Acquired by Boomi Dec 2024 (~$100M)
- Now "Boomi Data Integration" within Boomi Enterprise Platform
- 100% SaaS, fully managed, cloud-native ELT data integration platform

## Core Concept: Rivers
All work organized into three "River" types:
1. **Source-to-Target River** - Data ingestion (extract from source → load to warehouse)
2. **Logic River** - Orchestration/transformation (SQL/Python, branching, loops, Sub-Rivers)
3. **Target-to-Source River** - Reverse ETL (push warehouse data back to operational systems)

## Core Modules
1. **Data Ingestion** - 200+ connectors, incremental loading, schema drift detection
2. **Data Transformation** - In-warehouse SQL/Python, dbt integration
3. **Data Orchestration** - Logic Rivers, conditional logic, scheduling, API/CLI management
4. **CDC Replication** - Log-based, real-time, Oracle/PostgreSQL/MySQL/SQL Server/MongoDB
5. **Reverse ETL** - Data activation back to CRMs, Slack, APIs
6. **DataOps Management** - Monitoring, error tracking, multi-env, CI/CD, RBAC
7. **Data Connector Agent (Blueprint)** - GenAI-powered custom connector creation (30X faster)

## Key Technical Details
- ELT-first approach (transform in-warehouse)
- Targets: Snowflake, BigQuery, Redshift, Databricks, Azure Synapse, Firebolt, S3, etc.
- Credit-based pricing (RPU - Rivery Pricing Unit)
- Plans: Base, Professional, Pro Plus, Enterprise
- SOC 2 Type II, GDPR, HIPAA, CCPA compliant

## Starter Kits
Pre-built production-ready pipeline templates for common use cases (marketing, CRM, e-commerce)

## Key Terms
- **River** = data pipeline
- **Sub-River** = reusable modular pipeline component
- **RPU** = pricing unit (by data volume or execution count)
- **Blueprint** = GenAI connector builder (now Data Connector Agent)
- **Starter Kit** = pre-built pipeline template
- **Custom File Zone** = enterprise data storage in customer-owned zones`;

export const WIZARD_STEPS = [
  { key: 'company-info', label: 'Company Info', required: false },
  { key: 'product-info', label: 'Product Info', required: true },
  { key: 'feature-info', label: 'Feature Info', required: true },
  { key: 'current-impl', label: 'Current Implementation', required: false },
  { key: 'figma-link', label: 'Figma File', required: false },
  { key: 'ds-storybook', label: 'Storybook', required: false },
  { key: 'ds-npm', label: 'NPM Package', required: false },
  { key: 'ds-figma', label: 'Design System Figma', required: false },
  { key: 'prototypes', label: 'Prototypes', required: false },
  { key: 'output-type', label: 'Output Type', required: true },
  { key: 'advanced-options', label: 'Advanced Options', required: false },
  { key: 'skills', label: 'Skills', required: false },
  { key: 'memories', label: 'Memories', required: false },
  { key: 'review', label: 'Review & Generate', required: false },
] as const;

export const TOTAL_STEPS = WIZARD_STEPS.length;
