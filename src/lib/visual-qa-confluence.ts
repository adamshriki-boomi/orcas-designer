import {
  VISUAL_QA_CATEGORIES,
  type VisualQaCategory,
  type VisualQaIssue,
  type VisualQaReport,
  type VisualQaSeverity,
} from './types'

export interface RenderConfluenceArgs {
  report: VisualQaReport
  designAttachmentName: string
  implAttachmentName: string
}

export function renderConfluenceStorage(args: RenderConfluenceArgs): string {
  const { report, designAttachmentName, implAttachmentName } = args
  const out: string[] = []

  out.push(`<h1>Visual QA — ${escapeText(report.title)}</h1>`)

  out.push(renderHeaderTable(report))

  out.push('<h2>Design vs Implementation</h2>')
  out.push(renderImageRow(designAttachmentName, implAttachmentName))

  if (report.summary) {
    out.push('<h2>Summary</h2>')
    out.push(`<p>${escapeText(report.summary)}</p>`)
  }

  if (report.issues.length > 0) {
    out.push('<h2>Issues</h2>')
    const groups = groupByCategory(report.issues)
    for (const category of groups.keys()) {
      out.push(`<h2>${escapeText(category)}</h2>`)
      for (const f of groups.get(category)!) {
        out.push(renderIssuePanel(f))
      }
    }
  }

  return out.join('\n')
}

export function renderMarkdown(report: VisualQaReport): string {
  const out: string[] = []
  out.push(`# Visual QA — ${report.title}`)
  out.push('')

  out.push(`- **Date:** ${formatDate(report.createdAt)}`)
  out.push(
    `- **Severity counts:** High ${report.severityCounts.high} · Medium ${report.severityCounts.medium} · Low ${report.severityCounts.low}`
  )
  if (report.designSource === 'figma' && report.designFigmaUrl) {
    out.push(`- **Figma:** ${report.designFigmaUrl}`)
  }
  out.push('')

  out.push('## Design vs Implementation')
  out.push('')
  out.push(`![Design](${report.designImageUrl})`)
  out.push('')
  out.push(`![Implementation](${report.implImageUrl})`)
  out.push('')

  if (report.summary) {
    out.push('## Summary')
    out.push('')
    out.push(report.summary)
    out.push('')
  }

  if (report.issues.length > 0) {
    out.push('## Issues')
    out.push('')
    const groups = groupByCategory(report.issues)
    for (const category of groups.keys()) {
      out.push(`### ${category}`)
      out.push('')
      for (const f of groups.get(category)!) {
        const tag = f.exosphereComponent ? ` · \`${f.exosphereComponent}\`` : ''
        out.push(`#### [${severityLabel(f.severity)}] ${f.location}${tag}`)
        out.push('')
        out.push(`- **Description:** ${f.description}`)
        out.push(`- **Expected:** ${f.expected}`)
        out.push(`- **Actual:** ${f.actual}`)
        out.push(`- **Suggested fix:** ${f.suggestedFix}`)
        out.push('')
      }
    }
  }

  return out.join('\n')
}

function renderHeaderTable(report: VisualQaReport): string {
  const rows: string[] = []
  rows.push(`<tr><th>Date</th><td>${escapeText(formatDate(report.createdAt))}</td></tr>`)
  rows.push(
    `<tr><th>Severity counts</th><td>High ${report.severityCounts.high} · Medium ${report.severityCounts.medium} · Low ${report.severityCounts.low}</td></tr>`
  )
  if (report.designSource === 'figma' && report.designFigmaUrl) {
    rows.push(
      `<tr><th>Figma</th><td><a href="${escapeAttr(report.designFigmaUrl)}">${escapeText(report.designFigmaUrl)}</a></td></tr>`
    )
  }
  return `<table><tbody>${rows.join('')}</tbody></table>`
}

function renderImageRow(designName: string, implName: string): string {
  return (
    '<table><tbody><tr>' +
    `<td><strong>Design</strong><br/><ac:image ac:thumbnail="false"><ri:attachment ri:filename="${escapeAttr(designName)}"/></ac:image></td>` +
    `<td><strong>Implementation</strong><br/><ac:image ac:thumbnail="false"><ri:attachment ri:filename="${escapeAttr(implName)}"/></ac:image></td>` +
    '</tr></tbody></table>'
  )
}

function renderIssuePanel(f: VisualQaIssue): string {
  const macro = severityToPanel(f.severity)
  const badge = f.exosphereComponent
    ? ` · <code>${escapeText(f.exosphereComponent)}</code>`
    : ''
  const body =
    `<p><strong>${severityLabel(f.severity)}</strong> · ${escapeText(f.category)}${badge}</p>` +
    `<p><strong>Location:</strong> ${escapeText(f.location)}</p>` +
    `<p>${escapeText(f.description)}</p>` +
    '<table><tbody>' +
    `<tr><th>Expected</th><td>${escapeText(f.expected)}</td></tr>` +
    `<tr><th>Actual</th><td>${escapeText(f.actual)}</td></tr>` +
    '</tbody></table>' +
    `<p><strong>Suggested fix:</strong> ${escapeText(f.suggestedFix)}</p>`

  return (
    `<ac:structured-macro ac:name="${macro}">` +
    `<ac:rich-text-body>${body}</ac:rich-text-body>` +
    '</ac:structured-macro>'
  )
}

function severityToPanel(sev: VisualQaSeverity): 'warning' | 'note' | 'info' {
  if (sev === 'high') return 'warning'
  if (sev === 'medium') return 'note'
  return 'info'
}

function severityLabel(sev: VisualQaSeverity): 'High' | 'Medium' | 'Low' {
  if (sev === 'high') return 'High'
  if (sev === 'medium') return 'Medium'
  return 'Low'
}

function groupByCategory(
  issues: readonly VisualQaIssue[]
): Map<VisualQaCategory, VisualQaIssue[]> {
  const map = new Map<VisualQaCategory, VisualQaIssue[]>()
  for (const f of issues) {
    if (!map.has(f.category)) map.set(f.category, [])
    map.get(f.category)!.push(f)
  }
  // Stable order: preserve first-seen, but fall back to canonical category order if helpful.
  void VISUAL_QA_CATEGORIES
  return map
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().slice(0, 10)
}
