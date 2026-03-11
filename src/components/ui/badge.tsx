"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link"
  | "design"
  | "superpowers"
  | "figma"
  | "atlassian"
  | "claude-management"
  | "meta"

function Badge({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variant === "default" && "bg-primary/10 text-primary",
        variant === "secondary" && "bg-muted text-muted-foreground",
        variant === "destructive" && "bg-destructive/10 text-destructive",
        variant === "outline" && "border border-border text-muted-foreground",
        variant === "ghost" && "text-muted-foreground",
        !["default", "secondary", "destructive", "outline", "ghost"].includes(variant) && "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
