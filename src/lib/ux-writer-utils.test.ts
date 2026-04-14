import { extractScreenshotPath, deriveNameFromDescription } from './ux-writer-utils';

describe('extractScreenshotPath', () => {
  it('returns null for empty string', () => {
    expect(extractScreenshotPath('')).toBeNull();
  });

  it('returns a plain storage path as-is', () => {
    const path = 'user-123/1713100000-screenshot.png';
    expect(extractScreenshotPath(path)).toBe(path);
  });

  it('extracts path from a Supabase signed URL', () => {
    const signedUrl =
      'https://abcxyz.supabase.co/storage/v1/object/sign/ux-writer-screenshots/user-123/1713100000-screenshot.png?token=eyJhbGci...';
    expect(extractScreenshotPath(signedUrl)).toBe('user-123/1713100000-screenshot.png');
  });

  it('decodes percent-encoded characters in the path', () => {
    const signedUrl =
      'https://abcxyz.supabase.co/storage/v1/object/sign/ux-writer-screenshots/user-123/image%20with%20spaces.png?token=abc';
    expect(extractScreenshotPath(signedUrl)).toBe('user-123/image with spaces.png');
  });

  it('returns null for an unrelated HTTP URL', () => {
    expect(extractScreenshotPath('https://example.com/image.png')).toBeNull();
  });

  it('returns null for a signed URL from a different bucket', () => {
    const url =
      'https://abcxyz.supabase.co/storage/v1/object/sign/other-bucket/file.png?token=abc';
    expect(extractScreenshotPath(url)).toBeNull();
  });

  it('handles paths with nested directories', () => {
    const signedUrl =
      'https://abcxyz.supabase.co/storage/v1/object/sign/ux-writer-screenshots/user-123/sub/dir/file.png?token=abc';
    expect(extractScreenshotPath(signedUrl)).toBe('user-123/sub/dir/file.png');
  });
});

describe('deriveNameFromDescription', () => {
  it('returns first 5 words of a long description', () => {
    expect(deriveNameFromDescription('Login dialog with error states for invalid credentials'))
      .toBe('Login dialog with error states');
  });

  it('returns the full text for short descriptions', () => {
    expect(deriveNameFromDescription('Login dialog')).toBe('Login dialog');
  });

  it('handles single-word descriptions', () => {
    expect(deriveNameFromDescription('Dashboard')).toBe('Dashboard');
  });

  it('handles extra whitespace', () => {
    expect(deriveNameFromDescription('  Login   dialog   page  '))
      .toBe('Login dialog page');
  });

  it('returns empty string for empty input', () => {
    expect(deriveNameFromDescription('')).toBe('');
  });
});
