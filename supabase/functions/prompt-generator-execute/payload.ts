// Pure helpers that turn a wizard snapshot + prompt metadata into the
// user-message markdown sent to Claude. Extracted from index.ts so it can
// be unit-tested with Deno.test without spinning up Deno.serve.

export interface PromptRow {
  id: string;
  name: string;
  user_id: string;
}

/**
 * Render a wizard snapshot into the user-message markdown.
 *
 * Rules:
 * - Empty strings, null, and undefined are skipped — they add noise without
 *   informing the brief.
 * - Non-string values are serialized as indented JSON so Claude can parse
 *   nested structure.
 * - The order follows `Object.entries` iteration order, which matches
 *   insertion order for plain objects — the caller controls section order by
 *   controlling the wizard-snapshot shape.
 */
export function buildUserMessage(
  prompt: PromptRow,
  wizardSnapshot: Record<string, unknown>,
  contextSnapshot: Record<string, unknown> | null,
): string {
  const blocks: string[] = [];
  blocks.push(`# Project\n${prompt.name} (id: ${prompt.id})`);

  for (const [section, value] of Object.entries(wizardSnapshot)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;

    const rendered = typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2);
    blocks.push(`# ${section}\n${rendered}`);
  }

  if (contextSnapshot && Object.keys(contextSnapshot).length > 0) {
    blocks.push(
      `# Selected memories & skills\n${JSON.stringify(contextSnapshot, null, 2)}`,
    );
  }

  blocks.push(
    "# Instructions\nAuthor the Claude Code brief. Read the Feature Definition and Design Products sections first — they control which phase sections to emit and whether to lead with a current-state analysis. Follow all conventions in the system prompt. Target 2000-4000 words.",
  );

  return blocks.join("\n\n");
}
