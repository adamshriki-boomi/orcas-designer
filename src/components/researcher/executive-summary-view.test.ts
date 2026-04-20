import { describe, it, expect } from 'vitest';
import { parseExecutiveSummary, parseActionItems } from './executive-summary-view';

const FULL_SUMMARY = `## TL;DR
Rivery has a real UX moat but it's buried under fragmented branding. Ship dual-labeling this quarter.

## Top Action Items

**[Priority: P0]** *(Impact: High)* — Fix the Rivery / Boomi dual-identity fragmentation
- **What to do:** Consolidate docs, URLs, SEO, and in-app branding.
- **Why:** IA Review flagged this as Critical L1.
- **Owner hint:** PM + Marketing/Brand

**[Priority: P1]** *(Impact: Medium)* — Dual-label core objects
- **What to do:** Ship "Pipelines (Rivers)".
- **Why:** Competitive UX called it a top risk.
- **Owner hint:** Design

**[Priority: P2]** *(Impact: Low)* — Polish onboarding
- **What to do:** Tweak empty states.
- **Why:** Minor usability friction in Heuristic Eval.
- **Owner hint:** Design

## Key Themes
- **Naming fragmentation**: Appeared in both methods.
- **Missing global search**: Called out by IA Review.

## Open Questions / Conflicts
No material conflicts — findings were internally consistent.

## What to Do Next
Kick off the dual-labeling working group by Monday.
`;

describe('parseExecutiveSummary', () => {
  it('pulls the TL;DR body out of the ## TL;DR section', () => {
    const r = parseExecutiveSummary(FULL_SUMMARY);
    expect(r.tldr).toContain("Rivery has a real UX moat");
    expect(r.tldr).not.toContain('## ');
  });

  it('extracts 3 action items in order', () => {
    const r = parseExecutiveSummary(FULL_SUMMARY);
    expect(r.actionItems).toHaveLength(3);
    expect(r.actionItems.map((a) => a.priority)).toEqual(['P0', 'P1', 'P2']);
    expect(r.actionItems.map((a) => a.impact)).toEqual(['High', 'Medium', 'Low']);
  });

  it('extracts every field of each action item', () => {
    const r = parseExecutiveSummary(FULL_SUMMARY);
    const first = r.actionItems[0];
    expect(first.title).toBe('Fix the Rivery / Boomi dual-identity fragmentation');
    expect(first.whatToDo).toBe('Consolidate docs, URLs, SEO, and in-app branding.');
    expect(first.why).toBe('IA Review flagged this as Critical L1.');
    expect(first.ownerHint).toBe('PM + Marketing/Brand');
  });

  it('pulls Key Themes body', () => {
    const r = parseExecutiveSummary(FULL_SUMMARY);
    expect(r.keyThemes).toContain('Naming fragmentation');
    expect(r.keyThemes).toContain('Missing global search');
  });

  it('pulls Open Questions body', () => {
    const r = parseExecutiveSummary(FULL_SUMMARY);
    expect(r.openQuestions).toContain('No material conflicts');
  });

  it('pulls What to Do Next body', () => {
    const r = parseExecutiveSummary(FULL_SUMMARY);
    expect(r.whatNext).toContain('dual-labeling working group');
  });

  it('accepts "Next Steps" as an alias for "What to Do Next"', () => {
    const md = `## TL;DR\nx\n\n## Next Steps\nGo ship it.`;
    const r = parseExecutiveSummary(md);
    expect(r.whatNext).toBe('Go ship it.');
  });

  it('accepts "Action Items" as an alias for "Top Action Items"', () => {
    const md = `## Action Items\n\n**[Priority: P0]** *(Impact: High)* — Do thing\n- **What to do:** now\n- **Why:** reasons\n- **Owner hint:** team`;
    const r = parseExecutiveSummary(md);
    expect(r.actionItems).toHaveLength(1);
  });

  it('returns empty fields when no structure is present (fallback path)', () => {
    const r = parseExecutiveSummary('Just a paragraph, no headings at all.');
    expect(r.tldr).toBe('');
    expect(r.actionItems).toEqual([]);
    expect(r.keyThemes).toBe('');
    expect(r.whatNext).toBe('');
    expect(r.extras).toEqual([]);
  });

  it('captures unknown sections as extras without dropping them', () => {
    const md = `## TL;DR\nShip it.\n\n## Risks\nSome risks here.\n\n## Appendix\nMore stuff.`;
    const r = parseExecutiveSummary(md);
    expect(r.tldr).toBe('Ship it.');
    expect(r.extras.map((e) => e.heading)).toEqual(['Risks', 'Appendix']);
    expect(r.extras[0].body).toBe('Some risks here.');
  });

  it('tolerates en-dash, em-dash, and hyphen as the action-item separator', () => {
    const md = `## Action Items

**[Priority: P0]** *(Impact: High)* – En dash
- **What to do:** x
- **Why:** y
- **Owner hint:** team

**[Priority: P1]** *(Impact: Medium)* — Em dash
- **What to do:** x
- **Why:** y
- **Owner hint:** team

**[Priority: P2]** *(Impact: Low)* - Plain hyphen
- **What to do:** x
- **Why:** y
- **Owner hint:** team
`;
    const r = parseExecutiveSummary(md);
    expect(r.actionItems).toHaveLength(3);
    expect(r.actionItems.map((a) => a.title)).toEqual(['En dash', 'Em dash', 'Plain hyphen']);
  });
});

describe('parseActionItems', () => {
  it('returns empty array when given empty string', () => {
    expect(parseActionItems('')).toEqual([]);
    expect(parseActionItems('   ')).toEqual([]);
  });

  it('tolerates missing trailing fields', () => {
    const md = `**[Priority: P0]** *(Impact: High)* — Minimal
- **What to do:** Do it.`;
    const items = parseActionItems(md);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Minimal');
    expect(items[0].whatToDo).toBe('Do it.');
    expect(items[0].why).toBe('');
    expect(items[0].ownerHint).toBe('');
  });

  it('ignores text that looks similar but is not a valid action header', () => {
    const md = `**Priority: P0** missing brackets — Not an item
- **What to do:** x`;
    expect(parseActionItems(md)).toEqual([]);
  });

  it('handles multi-line bullet bodies without grabbing the next action', () => {
    const md = `**[Priority: P0]** *(Impact: High)* — First
- **What to do:** Line 1 of what.
- **Why:** Line 1 of why.
- **Owner hint:** First team

**[Priority: P1]** *(Impact: Medium)* — Second
- **What to do:** Second what.
- **Why:** Second why.
- **Owner hint:** Second team`;
    const items = parseActionItems(md);
    expect(items).toHaveLength(2);
    expect(items[0].ownerHint).toBe('First team');
    expect(items[1].title).toBe('Second');
  });
});
