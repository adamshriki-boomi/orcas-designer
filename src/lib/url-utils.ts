/**
 * Lightweight URL helpers shared across the Prompt Generator surface.
 * Moved out of the old prompt-sections/ folder when the deterministic
 * template engine was retired.
 */

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
