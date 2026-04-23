'use client';

import { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wand2, Link as LinkIcon } from 'lucide-react';
import type { Prompt, DesignProduct } from '@/lib/types';
import { isValidFigmaUrl } from '@/lib/validators';
import { getRelativeTime } from '@/lib/relative-time';

const ExBadge = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false },
);

const PRODUCT_LABEL: Record<DesignProduct, string> = {
  wireframe: 'Wireframe',
  mockup: 'Mockup',
  'animated-prototype': 'Animated prototype',
};

function getDescription(project: Prompt): string {
  const brief = project.featureDefinition.briefDescription.trim();
  if (brief) return brief;
  const productText = project.productInfo.textValue.trim();
  if (productText) return productText;
  return '';
}

export const PromptCard = memo(function PromptCard({ project }: { project: Prompt }) {
  const { relativeTime, hasGeneratedPrompt, products, hasFigma, description } = useMemo(() => {
    return {
      relativeTime: getRelativeTime(project.updatedAt),
      hasGeneratedPrompt: project.generatedPrompt.length > 0,
      products: project.designProducts.products,
      hasFigma: isValidFigmaUrl(project.designProducts.figmaDestinationUrl),
      description: getDescription(project),
    };
  }, [project]);

  return (
    <a
      href={`${process.env.NEXT_PUBLIC_BASE_PATH}/prompt-generator/${project.id}`}
      className="block h-full"
    >
      <Card className="group h-full cursor-pointer hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-sm">
              <Wand2 className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="font-heading font-semibold line-clamp-2 break-words">
                {project.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{relativeTime}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {description || <span className="italic opacity-60">No description</span>}
          </p>
        </CardContent>
        <div className="px-4 pb-1 flex items-center gap-2 flex-wrap">
          {hasGeneratedPrompt ? (
            <ExBadge color={'green' as never} shape={'round' as never} useTextContent>
              Generated
            </ExBadge>
          ) : (
            <ExBadge color={'gray' as never} shape={'round' as never} useTextContent>
              Draft
            </ExBadge>
          )}
          {products.map((product) => (
            <ExBadge
              key={product}
              color={'navy' as never}
              shape={'squared' as never}
              useTextContent
            >
              {PRODUCT_LABEL[product]}
            </ExBadge>
          ))}
          {hasFigma && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <LinkIcon className="size-3" />
              Figma
            </span>
          )}
        </div>
      </Card>
    </a>
  );
});
