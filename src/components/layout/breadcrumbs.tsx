'use client';

import dynamic from 'next/dynamic';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const BreadcrumbsInner = dynamic(
  () =>
    import('@boomi/exosphere').then(({ ExBreadcrumb, ExBreadcrumbItem }) => ({
      default: function BreadcrumbsExo({ items }: BreadcrumbsProps) {
        return (
          <ExBreadcrumb label="breadcrumb">
            {items.map((item, index) => (
              <ExBreadcrumbItem
                key={index}
                {...(item.href ? { link: item.href } : {})}
              >
                {item.label}
              </ExBreadcrumbItem>
            ))}
          </ExBreadcrumb>
        );
      },
    })),
  { ssr: false }
);

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="px-6 pt-2 pb-0">
      <BreadcrumbsInner items={items} />
    </div>
  );
}
