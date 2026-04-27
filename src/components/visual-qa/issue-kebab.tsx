'use client';

import dynamic from 'next/dynamic';

export interface IssueKebabAction {
  key: 'edit' | 'delete';
  label: string;
  onSelect: () => void;
  risky?: boolean;
}

interface IssueKebabProps {
  actions: IssueKebabAction[];
}

// Bundle ExDropdown + ExMenu + ExMenuItem in one dynamic import so the whole
// `<ex-dropdown>` subtree hydrates atomically. ExDropdown registers click
// listeners on its menu items inside `firstUpdated()`, a one-shot Lit
// lifecycle. Loading parent and children through separate dynamic imports
// would let the parent mount before its children and end up with zero
// registered handlers — clicks would silently no-op. Same gotcha as
// `ExSegmentedControls` (see `visual-qa-image-viewer.tsx`).
const IssueKebabInner = dynamic(
  () =>
    import('@boomi/exosphere').then(({ ExDropdown, ExMenu, ExMenuItem }) => ({
      default: function IssueKebabInnerImpl({ actions }: IssueKebabProps) {
        return (
          <ExDropdown
            // Exosphere uses kebab-case names from its own registry, not the
            // Material Design names (`more_vert`, `swap_horiz`, etc.). Wrong
            // names render as silent empty boxes. See
            // node_modules/@boomi/exosphere/dist/icon.js for the registry.
            icon="three-dots-vertical-fill"
            type={'tertiary' as never}
            size={'small' as never}
            tooltipText="More actions"
            label="More actions"
          >
            <ExMenu>
              {actions.map((action) => (
                <ExMenuItem
                  key={action.key}
                  variant={(action.risky ? 'risky' : 'standard') as never}
                  // ExMenuItem only attaches its click → onItemSelect handler
                  // when `action` is true. Without it, clicks are silently
                  // dropped (only Enter key works). This is the right setting
                  // for dropdown/menu-style items where each row is its own
                  // action; in ExSelect the parent wires clicks itself.
                  action
                  // Dispatches `onItemSelect`, not `onClick` — see
                  // node_modules/@boomi/exosphere/dist/react/menu-item/index.d.ts.
                  onItemSelect={action.onSelect}
                >
                  {action.label}
                </ExMenuItem>
              ))}
            </ExMenu>
          </ExDropdown>
        );
      },
    })),
  { ssr: false }
);

export function IssueKebab({ actions }: IssueKebabProps) {
  return <IssueKebabInner actions={actions} />;
}
