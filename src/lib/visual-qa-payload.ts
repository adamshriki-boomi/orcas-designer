import { VISUAL_QA_CATEGORIES } from './types'

export type VisualQaImageMime =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/gif'

const ALLOWED_MIMES: ReadonlySet<string> = new Set<VisualQaImageMime>([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

export interface ExtraMemory {
  name: string
  content: string
}

export interface BuildSystemPromptArgs {
  exosphereVisualQaMemory: string
  boomiContext: string
  productContext: string
  extraMemories: readonly ExtraMemory[]
}

export function buildSystemPrompt(args: BuildSystemPromptArgs): string {
  const sections: string[] = []

  sections.push(
    'You are a senior product designer performing a Visual QA review for Boomi.',
    'Compare the implementation against the design and produce a precise, jargon-free report a developer can act on.'
  )

  if (args.exosphereVisualQaMemory) {
    sections.push('## Exosphere Visual QA reference', args.exosphereVisualQaMemory)
  }
  if (args.boomiContext) {
    sections.push('## Boomi context', args.boomiContext)
  }
  if (args.productContext) {
    sections.push('## Product context', args.productContext)
  }

  for (const m of args.extraMemories) {
    if (!m.content) continue
    sections.push(`## ${m.name}`, m.content)
  }

  sections.push('## Output schema', buildSchemaInstructions())

  return sections.join('\n\n')
}

function buildSchemaInstructions(): string {
  const categories = VISUAL_QA_CATEGORIES.join(' | ')
  return [
    'Return strict JSON with this exact shape and nothing else (no prose, no fences):',
    '{',
    '  "summary": string,                    // one short paragraph overview',
    '  "findings": [',
    '    {',
    '      "severity": "low" | "medium" | "high",',
    `      "category": "${categories}",`,
    '      "exosphereComponent": string,     // optional — set when an Ex* component is misused, missing, or should be used',
    '      "location": string,               // jargon-free area description, e.g. "Header, right side"',
    '      "description": string,            // what is wrong, in plain language',
    '      "expected": string,               // what the design specifies',
    '      "actual": string,                 // what the implementation shows',
    '      "suggestedFix": string            // a concrete next step for the developer',
    '    }',
    '  ]',
    '}',
    '',
    'Severity rubric (per the design-review framework):',
    '- low: doesn\'t affect the total experience (e.g. small spacing inaccuracy)',
    '- medium: might affect the total experience (e.g. missing icon inside a button)',
    '- high: affects the entire experience (e.g. non-functional button, wrong primary action)',
  ].join('\n')
}

// ── User message (vision payload) ──────────────────────────────────

export interface ImageBlock {
  type: 'image'
  source: {
    type: 'base64'
    media_type: VisualQaImageMime
    data: string
  }
}

export interface TextBlock {
  type: 'text'
  text: string
}

export type MessageBlock = ImageBlock | TextBlock

export interface BuildUserMessageArgs {
  designB64: string
  designMime: VisualQaImageMime
  implB64: string
  implMime: VisualQaImageMime
}

export function buildUserMessage(args: BuildUserMessageArgs): MessageBlock[] {
  assertMime(args.designMime)
  assertMime(args.implMime)

  return [
    { type: 'text', text: 'Design (target):' },
    {
      type: 'image',
      source: { type: 'base64', media_type: args.designMime, data: args.designB64 },
    },
    { type: 'text', text: 'Implementation (current):' },
    {
      type: 'image',
      source: { type: 'base64', media_type: args.implMime, data: args.implB64 },
    },
    {
      type: 'text',
      text: 'Compare the two images and produce the JSON report per the schema in the system prompt.',
    },
  ]
}

function assertMime(mime: string): asserts mime is VisualQaImageMime {
  if (!ALLOWED_MIMES.has(mime)) {
    throw new Error(`Unsupported image media type: ${mime}`)
  }
}
