import type { FileAttachment } from './types';
import { generateId } from './id';
import { MAX_FILE_SIZE } from './validators';

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileToAttachment(file: File): Promise<FileAttachment> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.name}" exceeds the 10MB size limit.`);
  }

  const base64Data = await fileToBase64(file);
  return {
    id: generateId(),
    name: file.name,
    mimeType: file.type,
    size: file.size,
    base64Data,
    createdAt: new Date().toISOString(),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
