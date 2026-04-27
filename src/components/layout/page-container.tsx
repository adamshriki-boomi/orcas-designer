import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  wide?: boolean
  fluid?: boolean
}

export function PageContainer({ children, className, wide = false, fluid = false }: PageContainerProps) {
  if (fluid) {
    return <div className={cn("w-full", className)}>{children}</div>
  }
  return (
    <div className={cn(
      "mx-auto px-6 pb-12",
      wide ? "max-w-6xl" : "max-w-5xl",
      className
    )}>
      {children}
    </div>
  )
}
