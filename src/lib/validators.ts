export function isValidUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function validateUrl(value: string): string | null {
  if (!value.trim()) return 'URL is required';
  try {
    new URL(value);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
}

export function isValidFigmaUrl(value: string): boolean {
  if (!isValidUrl(value)) return false;
  try {
    const url = new URL(value);
    return url.hostname === 'figma.com' || url.hostname === 'www.figma.com';
  } catch {
    return false;
  }
}

export function isFieldFilled(field: { inputType: string; urlValue: string; textValue: string; files: unknown[] }): boolean {
  switch (field.inputType) {
    case 'url':
      return field.urlValue.trim().length > 0;
    case 'file':
      return field.files.length > 0;
    case 'text':
      return field.textValue.trim().length > 0;
    default:
      return false;
  }
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_PROJECT_SIZE = 50 * 1024 * 1024; // 50MB
