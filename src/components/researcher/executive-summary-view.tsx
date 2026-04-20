'use client';

import { useMemo } from 'react';
import {
  Sparkles,
  Target,
  Layers,
  HelpCircle,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  User,
} from 'lucide-react';
import { MarkdownContent } from './markdown-content';
import { cn } from '@/lib/utils';

type Priority = 'P0' | 'P1' | 'P2';
type Impact = 'High' | 'Medium' | 'Low';

interface ActionItem {
  priority: Priority;
  impact: Impact;
  title: string;
  whatToDo: string;
  why: string;
  ownerHint: string;
}

interface ParsedSummary {
  tldr: string;
  actionItems: ActionItem[];
  keyThemes: string;
  openQuestions: string;
  whatNext: string;
  /** Anything that didn't parse into a known section */
  extras: Array<{ heading: string; body: string }>;
}

// ─── Parser ──────────────────────────────────────────────────────────
// Exported for testing. These operate on arbitrary LLM output so the
// regex shape drift risk is real — `executive-summary-view.test.ts`
// exercises each branch.

const EMPTY_SUMMARY: ParsedSummary = {
  tldr: '',
  actionItems: [],
  keyThemes: '',
  openQuestions: '',
  whatNext: '',
  extras: [],
};

export function parseExecutiveSummary(markdown: string): ParsedSummary {
  const raw = markdown.trim();

  // No `## …` headings at all → nothing structured to pull out. Let the caller
  // render the markdown as-is instead of mining a heading out of the first line.
  if (!/^##\s+/m.test(raw)) {
    return EMPTY_SUMMARY;
  }

  // Locate each heading position so we can slice [heading, next-heading) bodies.
  const headingRe = /^##\s+(.+)$/gm;
  const headings: Array<{ label: string; matchStart: number; bodyStart: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(raw)) !== null) {
    headings.push({
      label: m[1].trim(),
      matchStart: m.index,
      bodyStart: m.index + m[0].length,
    });
  }

  const sections = new Map<string, string>();
  const extras: ParsedSummary['extras'] = [];

  for (let i = 0; i < headings.length; i++) {
    const { label, bodyStart } = headings[i];
    const bodyEnd = i + 1 < headings.length ? headings[i + 1].matchStart : raw.length;
    const body = raw.slice(bodyStart, bodyEnd).trim();
    const key = label.toLowerCase();

    if (key.startsWith('tl;dr') || key.startsWith('tldr')) sections.set('tldr', body);
    else if (key.includes('action item')) sections.set('actions', body);
    else if (key.includes('key theme') || key.includes('theme')) sections.set('themes', body);
    else if (key.includes('open question') || key.includes('conflict')) sections.set('open', body);
    else if (key.includes('what to do next') || key.includes('next step')) sections.set('next', body);
    else extras.push({ heading: label, body });
  }

  return {
    tldr: sections.get('tldr') ?? '',
    actionItems: parseActionItems(sections.get('actions') ?? ''),
    keyThemes: sections.get('themes') ?? '',
    openQuestions: sections.get('open') ?? '',
    whatNext: sections.get('next') ?? '',
    extras,
  };
}

export function parseActionItems(text: string): ActionItem[] {
  if (!text.trim()) return [];

  // Each action starts with **[Priority: P0]** *(Impact: High)* — Title
  const headerRe = /\*\*\[Priority:\s*(P0|P1|P2)\]\*\*\s*\*\(Impact:\s*(High|Medium|Low)\)\*\s*[—–-]\s*([^\n]+)/g;
  const matches: Array<{ m: RegExpExecArray; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(text)) !== null) {
    matches.push({ m, start: m.index, end: m.index + m[0].length });
  }

  const items: ActionItem[] = [];
  for (let i = 0; i < matches.length; i++) {
    const { m: match, end } = matches[i];
    const [, priority, impact, title] = match;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].start : text.length;
    const body = text.slice(end, bodyEnd).trim();

    const whatMatch = body.match(/\*\*What to do:?\*\*\s*([\s\S]+?)(?=\n\s*[-*]\s*\*\*(?:Why|Owner hint):|\n\n|$)/i);
    const whyMatch = body.match(/\*\*Why:?\*\*\s*([\s\S]+?)(?=\n\s*[-*]\s*\*\*Owner hint:|\n\n|$)/i);
    const ownerMatch = body.match(/\*\*Owner hint:?\*\*\s*([\s\S]+?)(?=\n\n|$)/i);

    items.push({
      priority: priority as Priority,
      impact: impact as Impact,
      title: title.trim(),
      whatToDo: cleanField(whatMatch?.[1]),
      why: cleanField(whyMatch?.[1]),
      ownerHint: cleanField(ownerMatch?.[1]),
    });
  }

  return items;
}

function cleanField(text: string | undefined): string {
  if (!text) return '';
  return text.trim().replace(/\s+\n\s*/g, ' ').replace(/\n+/g, ' ');
}

// ─── Visual tokens ───────────────────────────────────────────────────

function priorityStyles(p: Priority) {
  switch (p) {
    case 'P0':
      return {
        bg: 'bg-destructive/10',
        text: 'text-destructive',
        border: 'border-destructive/30',
        stripe: 'bg-destructive',
        label: 'Critical',
      };
    case 'P1':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
        stripe: 'bg-amber-500',
        label: 'High',
      };
    case 'P2':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/30',
        stripe: 'bg-blue-500',
        label: 'Polish',
      };
  }
}

function impactStyles(i: Impact) {
  switch (i) {
    case 'High':
      return 'bg-foreground/10 text-foreground';
    case 'Medium':
      return 'bg-muted text-muted-foreground';
    case 'Low':
      return 'bg-muted/60 text-muted-foreground';
  }
}

// ─── Component ───────────────────────────────────────────────────────

interface ExecutiveSummaryViewProps {
  markdown: string;
}

export function ExecutiveSummaryView({ markdown }: ExecutiveSummaryViewProps) {
  const parsed = useMemo(() => parseExecutiveSummary(markdown), [markdown]);
  const hasStructure =
    parsed.tldr || parsed.actionItems.length > 0 || parsed.keyThemes || parsed.whatNext;

  // Graceful fallback: if we can't parse any structure (older run, unusual output)
  // render the whole thing as nicely-formatted markdown instead of pretending.
  if (!hasStructure) {
    return <MarkdownContent>{markdown}</MarkdownContent>;
  }

  return (
    <div className="space-y-8">
      {/* TL;DR — hero callout */}
      {parsed.tldr && (
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                TL;DR
              </p>
              <MarkdownContent compact>{parsed.tldr}</MarkdownContent>
            </div>
          </div>
        </section>
      )}

      {/* Top Action Items */}
      {parsed.actionItems.length > 0 && (
        <section>
          <SectionHeader
            icon={<Target className="size-5" />}
            title="Top Action Items"
            hint={`${parsed.actionItems.length} item${parsed.actionItems.length === 1 ? '' : 's'} ranked by priority`}
          />
          <div className="mt-4 space-y-3">
            {parsed.actionItems.map((item, i) => (
              <ActionItemCard key={i} item={item} rank={i + 1} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-destructive" />
              <strong className="text-destructive">P0 · Critical</strong> — blocks users now
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <strong className="text-amber-600 dark:text-amber-400">P1 · High</strong> — notable friction
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" />
              <strong className="text-blue-600 dark:text-blue-400">P2 · Polish</strong> — refinement
            </span>
          </div>
        </section>
      )}

      {/* Key Themes */}
      {parsed.keyThemes && (
        <section>
          <SectionHeader
            icon={<Layers className="size-5" />}
            title="Key Themes"
            hint="Patterns that appeared across multiple methods"
          />
          <div className="mt-4 rounded-2xl border bg-card p-6">
            <MarkdownContent>{parsed.keyThemes}</MarkdownContent>
          </div>
        </section>
      )}

      {/* Open Questions / Conflicts */}
      {parsed.openQuestions && (
        <section>
          <SectionHeader
            icon={<HelpCircle className="size-5" />}
            title="Open Questions & Conflicts"
            hint="Gaps and contradictions to follow up on"
          />
          <div
            className={cn(
              'mt-4 rounded-2xl border p-6',
              /no material conflict|internally consistent|none/i.test(parsed.openQuestions)
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-amber-500/30 bg-amber-500/5',
            )}
          >
            <MarkdownContent>{parsed.openQuestions}</MarkdownContent>
          </div>
        </section>
      )}

      {/* What to Do Next */}
      {parsed.whatNext && (
        <section>
          <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/[0.03] p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ArrowRight className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-lg font-semibold tracking-tight text-foreground mb-2">
                What to Do Next
              </p>
              <MarkdownContent compact>{parsed.whatNext}</MarkdownContent>
            </div>
          </div>
        </section>
      )}

      {/* Extras — unknown sections we didn't explicitly claim */}
      {parsed.extras.length > 0 && (
        <section className="space-y-4 pt-2">
          {parsed.extras.map((extra, i) => (
            <div key={i}>
              <h2 className="font-heading text-xl font-semibold tracking-tight mb-3">
                {extra.heading}
              </h2>
              <MarkdownContent>{extra.body}</MarkdownContent>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function ActionItemCard({ item, rank }: { item: ActionItem; rank: number }) {
  const p = priorityStyles(item.priority);

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md',
        p.border,
      )}
    >
      {/* Left priority stripe */}
      <div className={cn('absolute inset-y-0 left-0 w-1', p.stripe)} />

      <div className="pl-5 pr-5 py-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums',
              p.bg,
              p.text,
            )}
            aria-hidden
          >
            {rank}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                  p.bg,
                  p.text,
                )}
              >
                {item.priority} · {p.label}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  impactStyles(item.impact),
                )}
              >
                <TrendingUp className="size-3" />
                {item.impact} impact
              </span>
            </div>
            <h3 className="font-heading text-[15px] font-semibold leading-snug tracking-tight text-foreground">
              {item.title}
            </h3>

            {item.whatToDo && (
              <div className="mt-3 flex gap-2.5">
                <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ArrowRight className="size-3" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    What to do
                  </p>
                  <MarkdownContent compact>{item.whatToDo}</MarkdownContent>
                </div>
              </div>
            )}

            {item.why && (
              <div className="mt-2.5 flex gap-2.5">
                <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <AlertCircle className="size-3" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Why
                  </p>
                  <MarkdownContent compact>{item.why}</MarkdownContent>
                </div>
              </div>
            )}

            {item.ownerHint && (
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                  <User className="size-3" />
                  <span className="font-medium text-foreground">Owner:</span>
                  <span>{item.ownerHint}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
