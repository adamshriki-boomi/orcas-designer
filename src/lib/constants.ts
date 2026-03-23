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

export const BUILT_IN_EXOSPHERE_STORYBOOK = `# @boomi/exosphere v7.8.1 — Design System Reference

> Storybook: https://exosphere.boomi.com/ | Lit Web Components with React wrappers
> SSR: All components require \`dynamic(() => import(...), { ssr: false })\` in Next.js
> Enum values MUST be inlined as strings — never import enum types (causes HTMLElement SSR crash)

---

## Component Inventory (67 React Components)

### Buttons & Actions
- **ExButton** — type: "primary"|"secondary"|"tertiary", flavor: "base"|"periwinkle"|"branded"|"risky"|"tab", size: "small"|"default"|"large", as: "button"|"anchor", indicator (bool|number), href, target, rel
- **ExIconButton** — type: "primary"|"secondary"|"tertiary", flavor: "base"|"branded"|"risky"|"periwinkle"|"periwinkle_green", size: "default"|"small"|"x-small", icon (Material Design name string), tooltipText, useTooltipPortal, circular, indicator, variant, hover, pressed
- **ExLink** — size: "small"|"medium"|"large", href, target, rel, newTab, label
- **ExToggle** — on (boolean), controlled, showToggleLabel, showSymbol, size, leftIcon, rightIcon, label

### Form Controls
- **ExInput** — type: "text"|"password"|"email"|"number"|"phone"|"currency"|"date"|etc., footerType: "info"|"success"|"error"|"warning", searchSize: "medium"|"large", searchFlavor: "white"|"gray", clearable, togglePassword, noSpinButtons, hideCharCount, required, helpText, infoText, errorMsg
- **ExTextarea** — footerType: "info"|"success"|"error"|"warning", rows, maxLength, helpText, errorMsg, required
- **ExCheckbox** — size: "small"|"medium"|"large", footerType: "info"|"success"|"error"|"warning", checked, indeterminate, controlled, showStatusIcon
- **ExCheckboxGroup** — label, alignment, footerType, showStatusIcon
- **ExNestedCheckboxGroup** — nested variant of checkbox group
- **ExRadio** — size: "small"|"medium"|"large", footerType: "info"|"success"|"error"|"warning", checked, showStatusIcon
- **ExRadioGroup** — label, alignment, footerType, showStatusIcon
- **ExFileUploader** — size: "medium"|"large", sizeUnit: "MB"|"KB", mainText, buttonText, icon, fileTypes, maxSize, singleFileUpload, errorState, progressBarFluidWidth

### Dropdowns & Select
- **ExSelect** — type: "SINGLE"|"MULTI", selected, placeholder, helpText, errorMsg, isMenuItemsDynamic
- **ExCombobox** — size: "default"|"large"|"standard"|"medium"|"small", type: "input"|"standard", select: "single"|"multi"|"default", searchSize: "medium"|"large", menuHeight, noResultText, noOptionText, loader
- **ExDropdown** — width, height, variant, customWidth
- **ExMenu** — width: "default"|"medium"|"large"|"x-large"|"xx-large"|"fluid"|"full-fluid", variant: "navigation"|"action", height: "default"|"medium"|"large"
- **ExMenuItem** — variant options available
- **ExMenuItemGroup** — category variant
- **ExDatePicker** — label, value, placeholder, disabled, required
- **ExTimePicker** (tag: ex-time-range-picker) — startTime, endTime

### Data Display
- **ExBadge** — color: "gray"|"red"|"navy"|"green"|"yellow"|"blue"|"orange"|"white", shape: "round"|"squared", size: "default"|"small"|"extrasmall"|"tiny", showIcon, icon, useTextContent (use \`true\` to avoid Lit template placeholders)
- **ExLabel** — type: "info"|"success"|"error"|"warning", width: "default"|"auto", tooltipText
- **ExIcon** — icon (Material Design name), variant: "icon"|"secondary"|"tertiary"|"inverse"|"disabled"|"danger"|"default"|"original", size: "XS"|"S"|"M"|"L"|"6XL", hideBrowserTooltip
- **ExAvatar** — type, size variants
- **ExPill** — color, size variants
- **ExPillGroup** — container for pills
- **ExLoader** — size, variant, state variants

### Layout & Navigation
- **ExLeftmenubarAdjustable** — expandWidth, collapseWidth, isCollapse, showAvatar, firstName, lastName, animated, collapsed, defaultMinResize, defaultMaxResize, resize, expandable, preventStacking
- **ExLeftmenubarLink** — selected, disabled, label, tooltipText, isCollapsed, haveBorder. ⚠️ NO \`icon\` prop — use \`<ExIcon icon="name" slot="icon" />\`
- **ExLeftmenubarDropdown** — label, tooltipText, open, disabled, isCollapsed, selected, animated
- **ExLeftMenubarItem** — selected, disabled, label, haveBorder
- **ExLeftmenubarCategoryTitle** — label
- **ExLeftmenubarDivider** — no props
- **ExLeftmenubarTableRow** — label, tag
- **ExLeftmenubarTableCol** — no props
- **ExBreadcrumb** — label (a11y), variant: "collapsed"|"fluid"
- **ExBreadcrumbItem** — link (URL string), rel, target. Text as children slot
- **ExPageHeader** — slot-based
- **ExFooter** / **ExFooterLinkGroup** / **ExFooterLink** — href, target
- **ExContainer** — generic container

### Panels & Drawers
- **ExSideDrawer** — width: "25"|"50"|"75"|"default", panelTitle, infoText, open, hideClose, navigation, footer (must be \`true\` for footer slot to render), top, icon, leadingIconLabel, resize, expandable, noMarginSlot, preventStacking, expanded. onClose+onCancel handle ESC and backdrop natively
- **ExNavigationDrawer** — navigation drawer variant
- **ExCard** — minimal, slot-based
- **ExPanel** — content panel

### Tabs & Accordion
- **ExTab** — selectedIndex. ⚠️ onSelect fires CustomEvent with \`detail.selectedIndex\` (NOT \`detail.index\` — TypeScript type is wrong!)
- **ExTabItem** — variant options
- **ExAccordion** — variant: "elevated"|"flat", allowMultiple
- **ExAccordionItem** — open, label, leadingIcon, variant, leadingIconLabel, useEnhancedStyles

### Dialog & Notifications
- **ExDialog** — headerContent: "info"|"warning"|"positive"|"negative"|"critical"|"announcement"|"media", variant: "spaced", dialogTitle, subHeader, open, staticBackdrop, hideClose, animated, hideLeadingIcon, padding
- **ExAlertPopup** — popup alert variant
- **ExAlertBanner** — banner alert variant
- **ExAlertToast** — type: "Information"|"Success"|"Warning"|"Error", toasts[], options: { maxToastsToShow, duration }
- **ToastController** — static: initialize(), show(toast), dismiss(id), setOptions()

### Data & Visualization
- **ExTable** — gridOptions (JS object, ag-grid based), editableContent, overflowVisible, hideSortOrder, stickyHeader, domLayoutNormal
- **ExChart** — options (JS object, NOT string). options.type: "donut-chart"|"stack-bar"|"grouped-bar"|"line-chart"
- **ExStructuredList** / Body / Row / Col / ColGroup / Subheader — structured data layout
- **ExTree** — tree view
- **ExPagination** — type: "compact"|"default", totalItems, pageSize, pageSizeOptions[], selectedPage, hideControls, hideGoToPage, hideItemPerPage, alwaysShowItemsPerPage

### Carousel & Wizard
- **ExCarousel** / **ExCarouselItem** — carousel layout
- **ExWizard** — selectedIndex, totalItems, allowMultiple, wizardTitle, headerDescription, type, step, tooltipText, hideActions, disableNavigation
- **ExWizardItem** — open, title, step, description, show

### Content Editing
- **ExJsonEditor** — JSON editor
- **ExRichTextEditor** — rich text editor
- **ExRichInput** / **ExRichInputSuggestion** — type variants

### Miscellaneous
- **ExSegmentedControl** — segmentPlace: "inner"|"first"|"last", segmentVariant: "white"|"gray", tooltipPlacement: "top"|"bottom", selected, disabled
- **ExSegmentedControls** — container for segmented controls
- **ExTile** — tile variant
- **ExFilter** — filter component
- **ExEmptyState** — empty state display
- **ExTooltip** — position: "top"|"bottom"|"right"|"left", alignment: "start"|"middle"|"end", variant: "default"|"custom", trigger, tooltipDelay, hideDelay, showTooltipOnOverflow, usePortal, keepPopupOpen
- **ExResizeHandle** — resizer position variants

---

## Design Tokens

### Color Palette
Families: navy, blue, aqua, green, yellow, red, orange, coral, purple, periwinkle, magenta, gray, brand
Shades: 10, 20, 30, 40, 50, 60, 70, 80, 90
Pattern: \`--exo-palette-{COLOR}-{SHADE}\`, \`--exo-palette-{COLOR}-{SHADE}-rgb\`

### Semantic Colors (Light & Dark themes)
**Background**: --exo-color-background, -secondary, -tertiary, -disabled, -brand, -action, -action-secondary, -selected, -selected-weak, -selected-hover, -success, -warning, -danger-weak, -danger-strong, -danger-extreme, -highlight, -info, --exo-color-surface-ai-action, -ai-action-hover
**Font**: --exo-color-font, -secondary, -tertiary, -link, -link-hover, -link-secondary, -success, -danger, -code, -disabled, -inverse
**Icon**: --exo-color-icon, -secondary, -tertiary, -danger, -disabled, -inverse
**Border**: --exo-color-border, -secondary, -tertiary, -selected, -action, -action-hover, -highlight, -danger-weak, -danger-strong, -danger-extreme, -inverse, -contrast
**Outline**: --exo-color-outline-weak, -moderate, -strong, -extreme, -inverse
**Shadow**: --exo-color-shadow-weak, -moderate, -strong
**Scrim**: --exo-color-scrim

### Typography
Fonts: --exo-font-brand ("Poppins"), --exo-font-family ("Noto Sans"), --exo-font-monospace ("Fira Mono")
Sizes: --exo-font-size-x-micro (0.625rem), -micro (0.75rem), -x-small (0.813rem), -small (0.875rem), -medium (1rem), -large (1.12rem), -x-large (1.25rem), -2x-large through -7x-large
Weights: --exo-font-weight-light (300), -regular (400), -semi-bold (600), -bold (700)
Line heights: --exo-line-height-heading (1.25em), -body (1.5em), -denser, -looser

### Spacing
--exo-spacing-none (0), -4x-small (0.0625rem), -3x-small (0.125rem), -2x-small (0.25rem), -x-small (0.5rem), -small (0.75rem), -standard (1rem), -medium (1.25rem), -large (1.5rem), -x-large (2rem), -2x-large, -3x-large+

### Z-Index
--exo-z-index-layer-1 (900), -layer-2 (901), -layer-3 (902), -layer-4 (903), -layer-5 (9999)
--exo-z-index-dialog (900), -select-menu-input (901), -select-menu-dropdown (902), -dialog-overlay (903), -tooltip-popup (9999)

### Opacity
--exo-opacity-0 (transparent), -1 (0.1), -2 (0.15), -3 (0.4), -4 (0.5), -5 (0.6), -6 (0.75)

### Data Visualization
Color sets: --exo-color-set-1-1 through set-3-8
Data solid: navy, coral, purple, periwinkle, green, blue, gray, background-gray

---

## CSS Imports
\\\`\\\`\\\`
import '@boomi/exosphere/dist/styles.css';              // Required base styles
import '@boomi/exosphere/dist/exo-component-theme.css'; // Optional theme overrides
import '@boomi/exosphere/dist/exo-table-styles.css';    // For ag-grid tables
import '@boomi/exosphere/dist/ui-kit/ai.css';           // AI theme variant
import '@boomi/exosphere/dist/ui-kit/discover.css';     // Discover theme variant
import '@boomi/exosphere/dist/icon.js';                 // Material Design Icons
\\\`\\\`\\\`

## Key Gotchas
1. **SSR**: All Exosphere components need \`dynamic(() => import(...), { ssr: false })\` — they extend HTMLElement which doesn't exist server-side
2. **Enum imports crash SSR**: Always inline enum values as strings, never import enum types
3. **ExLeftmenubarLink has NO icon prop**: Pass icons via named slot: \`<ExIcon icon="home" slot="icon" />\`
4. **ExTab onSelect event**: Fires \`detail.selectedIndex\` (TypeScript type says \`detail.index\` — this is WRONG)
5. **ExSideDrawer footer slot**: Set \`footer={true}\` prop or footer slot content won't render
6. **ExBadge text**: Use \`useTextContent={true}\` to avoid Lit template placeholder issues in badge text
7. **ExChart options**: Pass JS object directly, not a JSON string
8. **ExTable gridOptions**: Pass JS object (ag-grid compatible), not string`;

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
