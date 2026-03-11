import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function Header({ title, description, action, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-6 py-6",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
