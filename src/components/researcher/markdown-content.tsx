'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  children: string;
  className?: string;
  /** Use tighter spacing — for callouts inside cards */
  compact?: boolean;
}

/**
 * Opinionated markdown renderer for researcher output. Matches the app's
 * Poppins/Noto Sans typography and Exosphere color tokens. Supports GFM
 * (tables, task lists, strikethrough) and produces screenshot-worthy output.
 *
 * Use <MarkdownContent> for generic sections (method results, process book,
 * framing document). The executive summary has its own richer view that
 * extracts action items into first-class cards.
 */
export function MarkdownContent({ children, className, compact = false }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        'text-foreground max-w-none',
        compact ? 'text-sm leading-relaxed' : 'text-base leading-7',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-heading text-2xl font-semibold tracking-tight mt-8 first:mt-0 mb-4 text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-heading text-xl font-semibold tracking-tight mt-8 first:mt-0 mb-3 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-heading text-base font-semibold tracking-tight mt-6 first:mt-0 mb-2 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-heading text-sm font-semibold uppercase tracking-widest mt-5 first:mt-0 mb-2 text-muted-foreground">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className={cn('text-foreground/90', compact ? 'mb-2' : 'mb-4')}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul className={cn('list-disc pl-6 space-y-1.5 text-foreground/90', compact ? 'mb-2' : 'mb-4')}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={cn('list-decimal pl-6 space-y-1.5 text-foreground/90', compact ? 'mb-2' : 'mb-4')}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-4 bg-primary/5 rounded-r italic text-foreground/80">
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeCn }) => {
            const isInline = !codeCn;
            if (isInline) {
              return (
                <code className="font-mono text-[0.875em] rounded bg-muted px-1.5 py-0.5 text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="font-mono text-sm text-foreground whitespace-pre-wrap">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="rounded-lg bg-muted p-4 overflow-x-auto my-4 text-sm">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-8 border-border/60" />,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="px-3 py-2 align-top text-foreground/90">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
