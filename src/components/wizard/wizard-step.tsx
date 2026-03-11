"use client";

interface WizardStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function WizardStep({ title, description, children }: WizardStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
