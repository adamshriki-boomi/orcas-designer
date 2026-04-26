import { cn } from '@/lib/utils';

type OrcasMarkProps = {
  className?: string;
  variant?: 'default' | 'inverse';
};

export function OrcasMark({ className, variant = 'default' }: OrcasMarkProps) {
  const sourceColor = variant === 'inverse' ? '#FFFFFF' : '#033D58';

  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block', className)}
      aria-label="Orcas Designer"
      role="img"
    >
      <line x1="8" y1="45" x2="56" y2="45" stroke={sourceColor} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 12 39 A 20 20 0 0 1 52 39" stroke="#A9DFDA" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 18 39 A 14 14 0 0 1 46 39" stroke="#79BFBE" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 24 39 A 8 8 0 0 1 40 39" stroke="#127B87" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="41" r="3.5" fill={sourceColor} />
    </svg>
  );
}
