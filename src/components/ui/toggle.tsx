"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ToggleVariant = "default" | "outline"
type ToggleSize = "default" | "sm" | "lg"

interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ToggleVariant
  size?: ToggleSize
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

function toggleVariants({
  variant = "default",
  size = "default",
  className = "",
}: {
  variant?: ToggleVariant
  size?: ToggleSize
  className?: string
} = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground",
    variant === "outline" && "border border-input bg-transparent",
    size === "default" && "h-8 min-w-8 px-2",
    size === "sm" && "h-7 min-w-7 px-1.5 text-[0.8rem]",
    size === "lg" && "h-9 min-w-9 px-2.5",
    className
  )
}

function Toggle({
  className,
  variant = "default",
  size = "default",
  pressed,
  defaultPressed = false,
  onPressedChange,
  children,
  ...props
}: ToggleProps) {
  const [internalPressed, setInternalPressed] = React.useState(defaultPressed)
  const isPressed = pressed ?? internalPressed

  return (
    <button
      type="button"
      data-slot="toggle"
      aria-pressed={isPressed}
      data-state={isPressed ? "on" : "off"}
      className={cn(
        toggleVariants({ variant, size }),
        isPressed && "bg-muted",
        className
      )}
      onClick={() => {
        const next = !isPressed
        setInternalPressed(next)
        onPressedChange?.(next)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export { Toggle, toggleVariants }
