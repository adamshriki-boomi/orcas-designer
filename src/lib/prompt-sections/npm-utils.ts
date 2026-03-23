/**
 * Strips package-manager install prefixes (npm install, yarn add, pnpm add, bun add, etc.)
 * so that only the bare package specifier remains.
 */
export function normalizeNpmPackage(raw: string): string {
  return raw
    .trim()
    .replace(
      /^(?:npm\s+(?:install|i|add)|yarn\s+add|pnpm\s+(?:add|install|i)|bun\s+(?:add|install|i))\s+/i,
      '',
    )
    .trim();
}
