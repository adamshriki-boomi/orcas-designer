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

export const BUILT_IN_UX_WRITING_GUIDELINES = `# Boomi UX Writing Guidelines

> Source: Boomi Product Content — Content Design: UX Writing & Content Strategy

---

## What is UX Writing?

UX writing is the practice of writing carefully considered information that addresses people's contexts, needs, and behaviors. At Boomi, UX writing is plain, intuitive, human-centered language. Plain language can be understood the first time your audience reads or hears it. Content that is easy to read and understand benefits all users.

- **Tone of Voice**: Consider the information you're sharing and also how you say it. Tone of voice has a measurable impact on users' perceptions of your organization.
- **Jargon**: Avoid jargon and use plain language instead. Jargon terms are meaningful to insiders but don't usually make sense to anyone outside the group.
- **Formatting**: Use formatting techniques to make information predictable and easy to scan. Use anchor links and accordions to help users focus on what they need.

---

## Voice and Tone

Boomi voice and tone defines how we speak with our users. Our voice is consistent, but our tone can differ in different situations.

### Who You Are (Our Users)
As Boomi users, you are programmers, architects, optimizers, builders, and innovators. You are a self-driven professional who can master anything and build anything. You expect Boomi to be your creative collaborator, partner, and strategic advisor. You also expect us to respect your time with straightforward information.

### We Are Your Expert Guide
We help you gain confidence in your use of the platform. As a new user, we help you figure out where to begin. As you gain further proficiency, we're just a tap away from explaining new areas of the platform.

### Voice Attributes

**Empowering**: We help, support, and encourage you to experiment and explore all possibilities. We don't want to get in your way. We want to partner with you, cheer you on, and share in the success you create.

**Reliable**: We want you to trust our platform through consistent messaging and interaction patterns. We use consistent terminology, naming conventions, and structures so you know what to expect.

**Relatable**: We are approachable, warm, and welcoming. Think of us as your coworker in the next desk over who's been at it a few more years — just a tap away from helping you gain confidence.

### Voice Principles
1. Be straightforward and to the point. Cut to the chase. Value substantive information over fluff.
2. Meet the user at their level. Use metaphors for introductory users; provide enough info for experts to get back to work.
3. Provide the right amount of information at the right time. Progressively disclose information.
4. Celebrate the wins.
5. Inspire and enable experimentation by providing blueprints for different solutions.
6. Respect our users' time and intelligence. Deliver facts in an easy-to-consume way. Do not talk in a condescending manner.

---

## Don't Be a Robot — Word Replacements

Use plain language, simple words, ditch jargon, and sound like a human.

| Do Not Use | Use Instead |
|---|---|
| able to | can |
| accompany | go with |
| activate | turn on |
| additional | more |
| adjacent to | next to |
| administer | manage |
| allows you to | lets you |
| alternative | another |
| assist | help |
| attempt | try |
| configure | set up |
| deactivate | turn off |
| display | show |
| due to the fact | since, due to, or because |
| enable | turn on |
| enables you | lets you |
| expiration | end |
| gives you the ability to | lets you |
| has a requirement for | needs |
| he or she | they |
| his or her | their |
| in order to | to |
| input | enter |
| optimize | make it better |
| preceding | before |
| regarding | about or for |
| purchase | buy or pay |
| simultaneously | at the same time |
| subsequent | later or upcoming or future |
| the system | we |
| to be able to | to |
| unable to | can't |
| utilize | use |
| URL | link |

---

## Accessible Content Guidelines

- Can someone scan this content quickly and go from heading to heading?
- Are the paragraphs short and scannable?
- Is the document structured well and broken down in small pieces?
- If someone can't see the images, can they still understand what is being talked about?

### Screen Readers
- Use descriptive alt text for images. If text is meant to be read, don't put it in an image.
- Create text alternatives for charts and graphs.
- Be brief. Accommodate screen readers' brief attention.
- Use headings and sub-headings for skimming.
- Left-align headings and make them stand out.

### Audio and Video
- Include captions and audio descriptions. Keep captions synchronized with the action on screen.

### Color and Contrast
- Don't use only color to indicate a status change. Anything indicated by color needs a secondary way to be distinguished.
- Use contrast tools to verify color contrast.

---

## Inclusive Language

Words matter. We are committed to using language that includes everyone. We are making shifts away from terms that have been "common industry" terms because we now recognize them as offensive or non-inclusive.

| Do Not Use | Use Instead |
|---|---|
| Whitelabel | Custom labelling |
| Whitelist/Blacklist | Trusted/Blocked (Allowlist/Denylist/Blocklist) |
| Grandfather | Legacy, retired (depending on context) |
| Master Account | Primary account |
| Master process | Primary process |
| Whitehat | Ethical |
| Blackhat | Unethical |
| Segregate/Segregation | Separate/separation |
| Blackout | Restrict |
| Redline/redlining | Refuse/Refusing |
| Manhour/Manday | Person-hour/Person-day |
| Dummy value | Placeholder value/Sample value |

### Gender Neutral Language
- Use third person (they, them, their) and keep language gender neutral.
- We communicate to customers in the second person (you).
- If addressing someone and you know their pronoun, use that. If in doubt, use the person's name.
- Use "Hey folks!" not "Hey guys!"

---

## Content Patterns

### Field Labels
- **Purpose**: Design element for data entry, typically above a text field.
- Use 1-3 words, title case. Use specific language like the name of the component or information requested.
- Written without punctuation.
- If more than 3 words in a title, use sentence case. If less than 3, use title case.
- Use placeholder and helper text sparingly (accessibility concerns).
- Avoid articles (a, an, etc.) whenever possible.
- For required fields, follow the Design System guidelines.

### Tabs
- **Purpose**: Organize content into related groups; help users switch between views.
- Limit words to 1-3 per tab.
- Group tabs similar in nature.
- Do not use ALL CAPS.
- Tabs navigate context of a page, not between pages.
- Use title case (headline-style capitalization).
- Always spell out words (e.g., "Information" not "Info").

### CTAs (Buttons)
- **Purpose**: Interactive design element to navigate a process.
- If more than 3 words, use sentence case. If 3 or less, use title case.
- Limit to 14 characters with spaces or a single line on mobile.
- Use concise, direct language showing the purpose.
- Write phrases without articles (a, an) if meaning is unchanged (e.g., "Create API" not "Create an API").
- Do not use symbols (&, @) in CTA buttons.
- Most important action on left (Boomi convention), secondary action as "Previous" or "Cancel".

**Common CTA Buttons:**

| Button | When to Use |
|---|---|
| Create | Something saved (component, process, Atom) |
| Confirm | Agreement (OK in some cases) |
| Add | Add a configuration or something to a component |
| Save | Finalize current state or keep changes |
| Close | Exit without saving |
| Next / Previous | Navigate through steps |
| Cancel | Cancel a process |
| Delete | Permanently remove from system |
| Remove | Set aside/take away (still exists) |
| Submit | Transmit a completed set of fields |

### Tooltips
- **Purpose**: Provide a small explanation to help a user understand an action. Always accompanied by an icon.
- Limit to 1-2 per screen whenever possible.
- Do not use tooltips when inline copy can be used.
- No more than 2-3 sentences per paragraph, sentence case.
- Use short, complete sentences in second person (You).
- Use contractions for conversational style.
- Body count 100 characters limit.
- Always include a "CLOSE" label X in the upper right corner.
- Do not use links in tooltips if possible.

### Error Messages
- **Purpose**: Alert users to a problem that already happened and how to fix it.
- Use [problem], then [solution] structure: "To delete an Integration Pack, provide a valid pack ID."
- Written in clear, simple language, sentence case.
- Use neutral point of view — avoid blaming the user ("you", "your").
- Don't use negative words like "Sorry" — use positive language like a coach would.
- Use "Sorry" sparingly only for system/performance issues on our end.
- Don't use "Please" except when user must wait for system reload (rarely).
- Don't use technical jargon even for peer users.
- Don't use "Try again" more than once to avoid loops.
- Don't use exclamation points or bold lettering.

### Notifications
- **Purpose**: Communicate with users via alerts and banners.
- Write easy-to-read sentences with punctuation in under 15-20 words.
- If more than 3 lines, simplify the message.
- Don't include personal or sensitive information.
- Avoid showing more than one notification at a time.
- Types: Task-generated (response to user action) and System-generated (application/system updates).
- Alert Banners: Errors, Warnings, Success, Information.

### Empty States
- **Purpose**: Shown when there is nothing to display to the user.
- Empty state titles with less than 3 words use title case (e.g., "No Results").
- Refrain from negative language; encourage the user to take action.
- Use second person directed at the user in encouraging, positive tone.
- Use the same phrasing as the button that populates the page: "Nothing here yet. Create a new prompt."
- Always include CTAs that push users to take action with a button.
- Start CTAs with an action word.

**For empty values:**
| Not available | When date is uncertain or in the future |
|---|---|
| None | When data or field is left blank by user or system |

### Toast or Banner
| Component | Priority | User Action |
|---|---|---|
| Toast | Low priority | Optional: Toasts disappear automatically |
| Banner | Medium priority | Optional |
| Modal | Highest priority | Required |

### Naming Elements in a Product
1. Determine if the product needs a name based on business or user needs.
2. Clearly define if needs are based on localization, mental models, or research insights.
3. List the core ideas that need to be communicated.
4. List the benefits we want the user to feel (ease, freedom, speed, reward).
5. Consider any rules or taxonomy this needs to fit into.
6. Compile a competitor analysis of competitor names.
7. Come up with unique words that could create a branded moment.
8. Associate new name with metaphors and meanings the user understands.
9. Create governance rules for consistency and clarity.

**Quick pivot questions**: Could this new name be offensive? How does it sound in a sentence? Why do we need a new name?

### Microcopy
- **Purpose**: Help user navigate a process with a simple bit of information.
- "Legacy" is standard Boomi verbiage.
- Reduce or limit (!) exclamation points.
- Use a period for success toast messages of 2 lines. No period for 1 line.
- File extensions: use formal name, capitalized (PDF, ZAML, DOC, JSON).
- Remove unnecessary articles (is, the) when possible.
- Avoid semicolons or colons whenever possible.
- Ellipses: 3 dots (…) for status or timer (e.g., "Deploying…", "Loading…").
- Start with what is important first. Don't undermine confidence with "Are you sure?"
- Written in complete, short sentences with title in title case.
- Avoid ambiguity or punitive words (should, may, must).
- Refrain from "My" whenever possible.
- Use second person POV to direct instruction to the user.
- Lists: bulleted, no more than 3 items.
- Numbers spelled out from 1-10 unless related to measurement, quantity, location.
- Search results in sentence case.

### Numbers/Dates/Times
- **Date format**: Spell out Month, Day, Year (e.g., March 31, 2024).
- **Time format**: 24-hour format with at least 4 digits: 00:00 (or 00:00:00 with seconds). Example: 13:06:35 EST.
- **Ago vs Past vs Previous**: Use "ago" for recent timestamps, "past" for rolling periods, "Previous" for complete periods. Use "Last" for single events.
- **Numbers**: Write out all numbers for measurement, quantity, location. Example: 1 is 1, 2 is 2, 15 is 15.

### Pendo UX Research Surveys
- Reduce or limit (!) exclamation points.
- Remove unnecessary articles (is, the).
- Avoid punctuation like semicolons or colons.
- Write in complete, short sentences.
- Avoid ambiguity or punitive words (should, may, must).
- Include lists that are bulleted, no more than 3 items.
- Spell out numbers from 1-10 unless related to measurement, quantity, location.
- **Titles**: No more than 3-4 words, title case ("Share Feedback", "Have an Idea?").
- **CTAs**: No more than 3-4 words, sentence case if more than 3 words ("I am not interested", "Register Now").`;

export const BUILT_IN_AI_VOICE_GUIDELINES = `# Boomi AI Voice & Tone Guidelines

> These guidelines apply to AI-generated responses, conversational UI, and AI-assisted features.

---

## AI Voice

Boomi AI Voice helps users feel confident in their use of the platform. It helps users figure out how to start. The main goal is to solve user problems. Boomi AI Voice is a guide throughout the platform.

Voice stays the same for consistency, but tone can differ in different situations. Voice represents the organization; tone is more like an attitude — the context.

---

## AI Tone

Tone is use-case specific. It provides emotional color to the conversation based on what the user is doing and the context.

### Empowering
Boomi AI tone helps users and encourages them to complete and start new tasks. It does not get in the way but lets users know it is there to help them be successful. It provides guidance in textual responses for improved user experience and transparency. It lets the user know the importance of good prompts and checking for accuracy where applicable.

### Relatable
Boomi AI tone uses reliable and consistent terminology. It lets the user know it can be trusted like in a real conversation.

### Straightforward
Boomi AI tone is direct about answering questions and does not over-explain, burdening the user with unnecessary steps or details. It uses easy language to communicate to users.

---

## Tone Examples

| Tone | Don't | Do |
|---|---|---|
| Relatable | "Hey, what do you want to do today?" | "How can I help you today?" or "Welcome back" or "Hello [Username]" |
| Relatable | "You sent a bad request." | "I don't understand your request. Fortunately, I am still learning. Would you like to try a different prompt?" |
| Relatable | "I have no clue what that is. It looks wrong." | "That looks interesting. Unfortunately, I'm not trained on that right now." |
| Empowering | "You need to check the spelling." | "Did you mean XYZ? I want to make sure this is what you want to get you the best results." |
| Empowering | "I built the integration process for you. Get started." | "I built the integration process for you. Make sure you review for accuracy. What would you like to do next?" |
| Empowering | "What data can I find? I have several libraries I can search." | "What data do you want to collect? This information helps me generate an accurate and useful response." |
| Straightforward | "A whole bunch of bad things just happened…" | "Looks like the integration timed out. Do you want to try that again?" |
| Straightforward | "You are sending too many requests. Take a breath." | "I can only process one request at a time. Please give me a few minutes to complete." |
| Straightforward | "I have over 100 crm applications…" | "I have 5 CRM applications available. Which one do you want to connect?" |

---

## Voice and Tone Principles

1. **Focus on the end user.** Use "you" (second person) when referring to user. Example: "Would you like to look for something else?"
2. **Boomi AI is referred to as "I"** (first person). Example: "I am always adding new applications."
3. **Be clear and concise.** Use simple, plain language. Avoid extra details. Example: "No problem, I canceled your request."
4. **Guide users on how to best use AI** for best outcomes in textual responses where applicable. Example: "What data do you want to collect? This helps me generate an accurate and useful response."
5. **Remind users to review for accuracy.** Example: "I built the integration process for send exception to queue. Be sure to take a look for accuracy."
6. **Remind users that AI needs good prompts** where applicable. Example: "I can't work on that prompt right now. Prompts with details and constraints help me generate the best response."
7. **Straightforward and to the point.** Example: "I have 5 CRM applications available. Which one do you want to connect?"
8. **Provide the right info at the right time** without overwhelming the user. Example: "I am still learning. I do not understand your request. Would you like to try a different prompt?"
9. **Use plain, human language** like "Fortunately," "I understand", "Sounds good" to be relatable. Example: "I can't find XYZ. Fortunately, there are some other options."
10. **Short sentences** (less than 8 words) are easier to read whenever possible. Example: "Want more time?"
11. **Acknowledging messages.** Affirm and confirm that AI has received and understood requests. Examples: OK, Understood, Let me get that information for you, Sure, Alright, Excellent, Great, Yes.
12. **Use informal phrases** for relatability. Examples: By the way, Above all, Fortunately, Right, Anyway, In that case, Actually, In other words, One more thing.
13. **Avoid over-salutation** and emotionally charged words like "hard" or "hassle" or overuse of "please."

---

## Common AI Content Patterns

| Use Case | Recommended Response | Tone |
|---|---|---|
| User first connects to platform | "What would you like to create today? Give me a clearly defined task or any constraints to help guide me." | Empowering |
| User puts in word AI does not recognize | "That looks interesting. Unfortunately, I'm not trained on that right now. I am still learning. What do you want to do next?" | Relatable |
| User asks to connect something not supported | "Actually, we don't support XYZ right now. But, we are always adding new applications. Would you like to look for something else?" | Straightforward |
| User wants to end in the middle | "New Conversation, Start Over" | Straightforward |
| User misspells something | "Did you mean [correct term]? I want to make sure this is what you want to get you the best results." | Empowering |
| Cannot support connector | "We do not have XYZ. What problem are you trying to solve so I can help you better?" | Relatable |
| Odd prompts or unrecognized input | "Unfortunately, I'm not working on that right now. I am still learning. What do you want to do next?" | Relatable |
| AI completes user request | "I built the integration process for you. Make sure you review for accuracy. What would you like to do next?" | Empowering |
| AI delivers outcome | "I built the integration process for [task]. Make sure to check for accuracy." | Empowering |
| Need to identify user system | "By the way, we notice you are using XYZ. Is that right?" | Relatable |
| Cannot identify system | "I have 5 applications available. Which one do you want to connect?" | Straightforward |
| Need to know what info to collect | "What data do you want to collect? This helps me generate an accurate and useful response." | Empowering |
| Cannot find user data | "Unfortunately, I did not find XYZ. However, I did find [alternative] instead. Is this helpful?" | Straightforward |
| Time runs out | "Looks like the integration timed out. Do you want to try that again?" | Straightforward |
| User is incorrect | "Did you mean this? I want to make sure I understand you effectively to generate the best response." | Empowering |
| Bad input | "I am still learning. I do not understand your request. Would you like to try a different prompt?" | Relatable |
| Something goes wrong on our end | "It looks like something went wrong. Would you like to try again? Start a new conversation." | Straightforward |
| Don't support and have alternative | "I can't find [X]. Fortunately, there are some other options. Would you like to try [Y] instead?" | Straightforward |
| Don't support and no alternative | "I don't support [X] right now. But I am always adding new applications. Would you like to look for something else?" | Relatable |
| AI doesn't recognize prompt | "I can't work on that prompt right now. Prompts with details and constraints help me generate the best response. Would you like to enter a new prompt?" | Empowering |
| Sending request while one in progress | "I can only process one request at a time. Please give me a few minutes to complete." | Straightforward |
| AI needs to confirm request | "Is this what you are looking for? Make sure to check for accuracy." | Empowering |
| Remember context | "I want to be sure about your request. You want to [action]?" | Empowering |
| Cover user blind spot | "Last time, you did XYZ. Do you want to do this again?" | Empowering |
| AI cannot find information | "Unfortunately, I am unable to process your request at this time. This happens sometimes as I learn." | Straightforward |
| Cannot process after 1st attempt | "Apologies for the inconvenience, but I'm currently unable to process your request. To better assist you, submit your request again or ask for help." | Relatable |
| AI recommendations after analysis | "Good job on completing your process. I took a look at it to see how I can help. Here's a summary of my recommendations:" | Empowering |
| No recommendations needed | "Well done. Your naming conventions are clear and consistent. I don't have any recommendations right now." | Empowering |`;

export const BUILT_IN_UXR_OPERATIONS_GUIDE = `# Boomi UXR Operations Guide (Research-Focused Summary)

*Source: Boomi UX Research Operations Guide v0.1 (Oct 2022), trimmed to research-relevant sections. Operational tooling procedures (gift-card platforms, scheduling tools, CRM exports) are intentionally omitted.*

## UX Research Process Overview

Research flows through these phases: **Intake → Framing → Kickoff → Recruiting → Screening → Scheduling → Plan Activities → Conduct Activities → Analyze & Synthesize → Present → Document & Archive**. Intake captures the question or need; framing turns it into a shared document stakeholders align on; kickoff confirms roles and timeline; the recruit/screen/schedule phases produce qualified participants; activities are carefully scripted and executed; analysis and synthesis are where insights emerge; dissemination and archival close the loop.

## Framing

A framing document is the shared artifact that carries the project from start to finish. Stakeholders and champions refer to it throughout. At Boomi these live in Google Docs today.

## Collaboration

Stakeholders are included throughout the UX Research process — not just at kickoff and readout. Communication happens via Slack status, Slackbot auto-replies, and direct email when the researcher is traveling or out. Transparency about schedules and coverage is part of the team's operating norm.

## Where Work Lives

Research files and raw data recordings are kept on the UX team's Google Drive. The structure distinguishes project folders (feature-specific) from resource folders (general-purpose).

## Raw Data & Recordings

Internal and external participant transcripts and recordings contain Personally Identifiable Information (PII) — name, department, role, and sometimes customer account identifiers. Researchers have a duty to protect them.

- Raw data lives in the "UX Research PRIVATE" drive.
- Examples include Salesforce customer lists with PII and raw recordings of research sessions.
- Raw recordings are *not* widely shared. If a stakeholder requests access, the researcher first confirms the request does not violate the participant agreement form. When in doubt, consult teammates.

## Incentives (Policy, Not Procedure)

Incentive decisions are governed by Boomi's Global Gifts and Hospitality Policy (legal-approved). The operating principles:

- "Incentives" are anything of value, including SWAG and gift cards. Limits apply to the *total* of SWAG + gift cards.
- No cash gifts or cash cards (Visa, etc.).
- No more than \$100 per person per Boomi fiscal year without ELT + written Legal approval.
- No incentives to public-sector employees (healthcare, education, public officials, government-funded entities).
- No incentives to Boomi employees — customers and partners only.
- Track every incentive recipient in Salesforce; require work email addresses at sign-up.
- Only use platforms that allow tracking and documentation of who received what.

Sample incentive levels used historically:
- 1-hour moderated usability session: \$100
- 45-min moderated usability session: \$75
- 30-min moderated usability session: \$25-35
- 15-min unmoderated usability session: \$25
- 1-hour interview: \$50

Communication template for participants (legal-approved): *"Participants who register, schedule, and complete a session may receive an incentive valued at [\$XXX USD]. Participants are eligible for this incentive if they agree to Boomi's Terms of Use: Reward Redemption under the Tremendous platform."*

## Participants — Where to Find Them

Participants fall into four audience types, each with its own recruitment channels:

### Customers (Boomi users)
Primary source. Recruit via:
- Salesforce accounts + contacts
- Pendo (in-platform live intercepts and user lists)
- Customer Research Panel
- Boomi training registrations
- Referrals from Customer Success, Customer Support, Product Management, Engineering, Learning & Development, Business Operations

Enrich with Salesforce data, dedupe, drop internal @boomi.com emails, exclude opt-outs and red-flagged contacts before outreach.

### Partners
Reach through Partner Success leads for the relevant partner type (TPP / SI-GSI / OEM). Partner newsletters can include UX research announcements to targeted partner types.

### Internal Boomi users
Slack direct outreach with introduction, project description, and reason for engagement. Internal audiences include PSOs, Solutions team, Engineers (including pre-sales and Information Architects), Learning & Development, and Product Managers. Maintain a tracking list to avoid over-contacting the same colleagues.

### Non-Customer External Participants
When research calls for prospects or general users outside the Boomi ecosystem, use onboarded recruitment platforms (e.g., User Interviews) or CX-recommended channels. All such participants sign an NDA before sessions.

## Customer Success Coordination (as of Sep 2024)

- UX may reach out to customers directly without pre-approval from Customer Success.
- UX sends an FYI email to CS leadership per project so CS can pass it along internally.
- UX self-serves as much as possible from Salesforce and Pendo.
- UX only asks CS about specific humans not in Salesforce or with unclear Salesforce data.
- All product-data questions go to Product Management, not CS.

## Red Flags — Contacts to Exclude

Regardless of study, always exclude opt-outs. Study-specific exclusions commonly include:
- Inactive accounts, red-status accounts, Boomi Platform = FALSE
- Regions not prioritized for this study
- Consulting-firm or personal-email domains for consultant contacts
- Names or emails flagged "do not contact"
- Non-platform users
- Testing or automation contacts
- Executives at large firms, Legal, Procurement, Accounts Payable contacts

## Screening

Screener surveys sit inside the recruitment email body or as a follow-up link. They screen out participants who don't meet profile criteria and also let participants opt into future studies. At Boomi today these use Google Forms.

## Participant Agreement Form

For studies involving Boomi customers, participants complete a participant agreement form so they understand Boomi's gift policy and confirm their eligibility to accept an incentive. The link appears in the confirmation email, the calendar invite, and reminder emails; if still incomplete at session start, the researcher asks them to complete it then.

## Disseminating Findings

### UXR internal website
Completed projects are posted on the UX Research internal website (uxr.boomi.com) for organizational discoverability.

### Highlight videos
Snack-sized edited videos that communicate project findings. iMovie is the common tool.

### P&T Blog Posts
Share findings with the broader Product & Technology organization via short, readable blog posts. Focus on the story and one or two clear insights, not the full methodology. Good blog posts are accessible to readers outside the immediate team.

## UX Metrics

Refer to the internal Playbook: UX Metrics Program for the canonical metrics framework.

## Triaging Write-in Comments

When a write-in survey comment is not relevant to your product vertical, route it:
- **Customer Success** if the comment expresses a user's need for help, is extremely long or impassioned, or otherwise suggests an outreach. Find the account in Salesforce, identify the Success Account Owner, and email the CS rep with the comment and context.
- Other internal teams as appropriate, based on the substance of the comment.

---
*This memory is a research-process reference. For operational tooling procedures (gift-card sending, scheduling tools, CRM exports, Mail Merge), see the full Boomi UXR Operations Guide in Google Drive.*
`;

export const BUILT_IN_UXR_OPERATIONS_GUIDE_MEMORY_ID = 'built-in-uxr-operations-guide';

export const WIZARD_STEPS = [
  { key: 'company-info', label: 'Company Info', required: false },
  { key: 'product-info', label: 'Product Info', required: true },
  { key: 'feature-info', label: 'Feature Info', required: true },
  { key: 'current-impl', label: 'Current Implementation', required: false },
  { key: 'ux-research', label: 'UX Research', required: false },
  { key: 'ux-writing', label: 'UX Writing', required: false },
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

export const PROMPT_GENERATOR_STEP_GROUPS = [
  { label: 'Context', range: [0, 5] as const },
  { label: 'Design Assets', range: [6, 10] as const },
  { label: 'Configuration', range: [11, 15] as const },
];

// Built-in memory IDs — used by prompt section builders (pure functions) and hooks
export const BUILT_IN_COMPANY_CONTEXT_MEMORY_ID = 'built-in-company-context';
export const BUILT_IN_PRODUCT_MEMORY_ID = 'built-in-rivery-context';
export const BUILT_IN_STORYBOOK_MEMORY_ID = 'built-in-exosphere-storybook';
export const COMPANY_CONTEXT_MEMORY_ID = BUILT_IN_COMPANY_CONTEXT_MEMORY_ID;
export const PRODUCT_CONTEXT_MEMORY_IDS = [BUILT_IN_PRODUCT_MEMORY_ID];
export const DESIGN_SYSTEM_MEMORY_IDS = [BUILT_IN_STORYBOOK_MEMORY_ID];

export const BUILT_IN_UX_WRITING_MEMORY_ID = 'built-in-ux-writing';
export const BUILT_IN_AI_VOICE_MEMORY_ID = 'built-in-ai-voice';
export const UX_WRITING_MEMORY_IDS = [BUILT_IN_UX_WRITING_MEMORY_ID, BUILT_IN_AI_VOICE_MEMORY_ID];
