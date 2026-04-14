/**
 * Extract the Supabase Storage path from a screenshot URL value.
 *
 * New analyses store the storage path directly (e.g. "user-id/1234-image.png").
 * Legacy analyses store a full signed URL that may have expired. This function
 * extracts the storage path from either format.
 *
 * Returns null if the value can't be resolved to a valid storage path.
 */
export function extractScreenshotPath(screenshotUrl: string): string | null {
  if (!screenshotUrl) return null;

  // Already a storage path (not a URL)
  if (!screenshotUrl.startsWith('http')) {
    return screenshotUrl;
  }

  // Legacy: extract path from Supabase signed URL
  // Format: https://xxx.supabase.co/storage/v1/object/sign/ux-writer-screenshots/{path}?token=...
  const match = screenshotUrl.match(/\/sign\/ux-writer-screenshots\/([^?]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Derive a fallback project name from a description when AI doesn't provide one.
 */
export function deriveNameFromDescription(description: string): string {
  return description.trim().split(/\s+/).slice(0, 5).join(' ');
}
