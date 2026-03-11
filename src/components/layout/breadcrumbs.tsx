'use client';

import dynamic from 'next/dynamic';

const ExBreadcrumbLazy = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBreadcrumb })),
  { ssr: false }
);
const ExBreadcrumbItemLazy = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBreadcrumbItem })),
  { ssr: false }
);

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="px-6 pt-2 pb-0">
      {/* Exosphere BreadcrumbVariant enum doesn't expose "fluid" as a string literal in TS defs */}
      <ExBreadcrumbLazy label="breadcrumb" variant={"fluid" as unknown as undefined}>
        {items.map((item, index) => (
          <ExBreadcrumbItemLazy
            key={index}
            {...(item.href ? { link: item.href } : {})}
          >
            {item.label}
          </ExBreadcrumbItemLazy>
        ))}
      </ExBreadcrumbLazy>
    </div>
  );
}
