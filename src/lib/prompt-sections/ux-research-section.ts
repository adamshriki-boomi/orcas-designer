import type { Project } from '../types';

interface GoogleDocInfo {
  type: 'document' | 'presentation' | 'spreadsheet';
  docId: string;
  exportUrl: string;
}

function parseGoogleDocUrl(url: string): GoogleDocInfo | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'docs.google.com') return null;

    const idMatch = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) return null;
    const docId = idMatch[1];

    if (parsed.pathname.includes('/document/')) {
      return {
        type: 'document',
        docId,
        exportUrl: `https://docs.google.com/document/d/${docId}/export?format=txt`,
      };
    }
    if (parsed.pathname.includes('/presentation/')) {
      return {
        type: 'presentation',
        docId,
        exportUrl: `https://docs.google.com/presentation/d/${docId}/export/pdf`,
      };
    }
    if (parsed.pathname.includes('/spreadsheets/')) {
      return {
        type: 'spreadsheet',
        docId,
        exportUrl: `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function buildGoogleDocsInstructions(url: string, docInfo: GoogleDocInfo): string {
  const typeLabels: Record<string, string> = {
    document: 'Google Doc',
    presentation: 'Google Slides',
    spreadsheet: 'Google Sheet',
  };

  const lines: string[] = [
    `**UX Research URL**: ${url}`,
    `Detected: ${typeLabels[docInfo.type]}`,
    '',
    '**Access strategy** (try in order):',
    `1. **Google Docs MCP** (preferred): If the Google Docs MCP server is available, use it to read the document directly.`,
    `2. **Public export URL**: Try fetching the content via WebFetch:`,
    `   \`${docInfo.exportUrl}\``,
    `   This works when the document is shared publicly ("Anyone with the link can view").`,
    `3. **Fallback**: If both methods fail (401/403), rely on the additional context and attached files below.`,
  ];

  return lines.join('\n');
}

export function buildUxResearchSection(project: Project): string {
  const field = project.uxResearch;
  const hasContent = field.urlValue || field.files.length > 0 || field.textValue;

  if (!hasContent) return '';

  const lines: string[] = ['## UX RESEARCH'];

  if (field.inputType === 'url' && field.urlValue) {
    const docInfo = parseGoogleDocUrl(field.urlValue);
    if (docInfo) {
      lines.push(buildGoogleDocsInstructions(field.urlValue, docInfo));
    } else {
      lines.push(`**UX Research URL**: ${field.urlValue}`);
      lines.push('Fetch this URL via WebFetch to access the research content.');
    }
  } else if (field.inputType === 'file' && field.files.length > 0) {
    lines.push('**Research files**:');
    for (const f of field.files) {
      lines.push(`- \`./assets/${f.name}\``);
    }
  } else if (field.inputType === 'text' && field.textValue) {
    lines.push(`**Research findings**:\n${field.textValue}`);
  }

  if (field.additionalContext) {
    lines.push(`> Additional context: ${field.additionalContext}`);
  }

  lines.push('');
  lines.push('Use these research insights to guide layout decisions, interaction flows, copy, and visual hierarchy.');

  return lines.join('\n\n');
}
