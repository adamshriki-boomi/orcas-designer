export interface GoogleDocInfo {
  type: 'document' | 'presentation' | 'spreadsheet';
  docId: string;
  exportUrl: string;
}

export function isFigmaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('figma.com');
  } catch {
    return false;
  }
}

export function parseGoogleDocUrl(url: string): GoogleDocInfo | null {
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

export function buildGoogleDocsInstructions(url: string, docInfo: GoogleDocInfo, label = 'UX Research URL'): string {
  const typeLabels: Record<string, string> = {
    document: 'Google Doc',
    presentation: 'Google Slides',
    spreadsheet: 'Google Sheet',
  };

  const lines: string[] = [
    `**${label}**: ${url}`,
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
