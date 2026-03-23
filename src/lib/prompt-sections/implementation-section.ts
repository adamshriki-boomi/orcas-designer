import type { Project } from '../types';
import { MANDATORY_SKILLS } from '../constants';

function inv(name: string): string {
  return MANDATORY_SKILLS.find(s => s.name === name)?.invocation ?? `/${name}`;
}

export function buildImplementationSection(project: Project): string {
  const impl = project.currentImplementation;
  const hasContent =
    (impl.inputType === 'url' && impl.urlValue) ||
    (impl.inputType === 'file' && impl.files.length > 0) ||
    (impl.inputType === 'text' && impl.textValue) ||
    impl.figmaLinks.length > 0;

  if (!hasContent) return '';

  const lines: string[] = ['## CURRENT IMPLEMENTATION'];

  if (impl.implementationMode === 'add-on-top') {
    lines.push('**Mode**: Add on top of existing implementation');
    lines.push(`**⚠️ CRITICAL — BUILD ON TOP, DO NOT REPLACE**: You MUST follow this two-step process:
1. **FIRST**: Faithfully reconstruct the existing UI from the reference provided below. Match typography, colors, component choices, layout patterns, and spacing exactly.
2. **THEN**: Add the new features described in <context> as additions to the reconstructed UI.

Do NOT start from a blank canvas. Do NOT redesign existing screens. The existing UI must appear unchanged — new features are layered on top.`);
    if (impl.urlValue || impl.files.length > 0) {
      lines.push(`**REQUIRED**: Use the ${inv('screenshot-overlay-positioning')} skill to analyze the existing UI and find precise coordinates for positioning new elements within the existing layout. This is REQUIRED, not optional.`);
    }
  } else {
    lines.push('**Mode**: Redesign from scratch');
    lines.push('The current implementation is provided for context and inspiration only — do not replicate the existing layout or interaction patterns. Create a fresh design that improves upon the existing experience.');
  }

  if (impl.inputType === 'url' && impl.urlValue) {
    lines.push(`**Reference URL**: ${impl.urlValue}`);
  } else if (impl.inputType === 'file' && impl.files.length > 0) {
    lines.push('**Screenshots**:');
    for (const f of impl.files) {
      lines.push(`- \`./assets/${f.name}\``);
    }
  } else if (impl.inputType === 'text' && impl.textValue) {
    lines.push(`**Description**:\n${impl.textValue}`);
  }

  if (impl.figmaLinks.length > 0) {
    lines.push('**Current Figma references**:');
    lines.push('**READ FROM THESE FILES** — use them to understand the current design state, component usage, and existing token choices before building.');
    for (const link of impl.figmaLinks) {
      lines.push(`- ${link}`);
    }
  }

  if (impl.additionalContext) {
    lines.push(`> Additional context: ${impl.additionalContext}`);
  }

  return lines.join('\n\n');
}
