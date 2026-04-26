import { cn } from '@/lib/utils';

type OrcasWordmarkProps = {
  className?: string;
};

export function OrcasWordmark({ className }: OrcasWordmarkProps) {
  return (
    <span className={cn('font-heading font-normal tracking-tight', className)}>
      Orcas Des<span style={{ color: 'var(--exo-color-font-link)' }}>i</span>gner
    </span>
  );
}
