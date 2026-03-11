"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

// Enum values matching @boomi/exosphere ButtonType, ButtonFlavor, ButtonSize
// Inlined to avoid SSR issues (HTMLElement not defined)
const EXO_TYPE = { PRIMARY: "primary", SECONDARY: "secondary", TERTIARY: "tertiary" } as const
const EXO_FLAVOR = { BASE: "base", BRANDED: "branded", RISKY: "risky" } as const
const EXO_SIZE = { SMALL: "small", DEFAULT: "default", LARGE: "large" } as const

const ExButtonLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExButton })),
  { ssr: false }
)

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

function mapVariantToExo(variant: ButtonVariant = "default") {
  switch (variant) {
    case "default":
      return { type: EXO_TYPE.PRIMARY, flavor: EXO_FLAVOR.BRANDED }
    case "outline":
      return { type: EXO_TYPE.SECONDARY, flavor: EXO_FLAVOR.BASE }
    case "secondary":
      return { type: EXO_TYPE.SECONDARY, flavor: EXO_FLAVOR.BASE }
    case "ghost":
      return { type: EXO_TYPE.TERTIARY, flavor: EXO_FLAVOR.BASE }
    case "destructive":
      return { type: EXO_TYPE.PRIMARY, flavor: EXO_FLAVOR.RISKY }
    case "link":
      return { type: EXO_TYPE.TERTIARY, flavor: EXO_FLAVOR.BASE }
  }
}

function mapSizeToExo(size: ButtonSize = "default") {
  switch (size) {
    case "xs":
    case "icon-xs":
      return EXO_SIZE.SMALL
    case "sm":
    case "icon-sm":
      return EXO_SIZE.SMALL
    case "lg":
    case "icon-lg":
      return EXO_SIZE.LARGE
    default:
      return EXO_SIZE.DEFAULT
  }
}

function isIconSize(size: ButtonSize = "default") {
  return size === "icon" || size === "icon-xs" || size === "icon-sm" || size === "icon-lg"
}

function getSizeClasses(size: ButtonSize = "default") {
  switch (size) {
    case "icon-xs": return "size-6"
    case "icon-sm": return "size-7"
    case "icon": return "size-8"
    case "icon-lg": return "size-9"
    default: return ""
  }
}

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  disabled,
  onClick,
  type: htmlType = "button",
  ...props
}: ButtonProps) {
  const exoProps = mapVariantToExo(variant)
  const exoSize = mapSizeToExo(size)
  const iconOnly = isIconSize(size)
  const sizeClasses = getSizeClasses(size)

  return (
    <ExButtonLazy
      // Exosphere's TS defs use enum types (ButtonType, ButtonFlavor, ButtonSize) that
      // can't be imported without SSR errors. The runtime accepts plain strings, so we
      // cast through `never` to bridge the type gap.
      type={exoProps.type as never}
      flavor={exoProps.flavor as never}
      size={exoSize as never}
      disabled={disabled || false}
      buttonType={htmlType as "button" | "submit" | "reset"}
      onClick={onClick as unknown as (e: CustomEvent) => void}
      className={cn(
        "cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        iconOnly && sizeClasses,
        variant === "link" && "underline-offset-4 hover:underline",
        className
      )}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </ExButtonLazy>
  )
}

function buttonVariants({
  variant = "default",
  size = "default",
  className = "",
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all duration-150 select-none",
    variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
    variant === "outline" && "border border-border bg-background hover:bg-muted hover:text-foreground",
    variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    variant === "ghost" && "hover:bg-primary/5 hover:text-primary",
    variant === "destructive" && "bg-destructive/10 text-destructive hover:bg-destructive/20",
    variant === "link" && "text-primary underline-offset-4 hover:underline",
    size === "default" && "h-8 gap-1.5 px-2.5",
    size === "xs" && "h-6 gap-1 px-2 text-xs",
    size === "sm" && "h-7 gap-1 px-2.5 text-[0.8rem]",
    size === "lg" && "h-9 gap-1.5 px-2.5",
    size === "icon" && "size-8",
    size === "icon-xs" && "size-6",
    size === "icon-sm" && "size-7",
    size === "icon-lg" && "size-9",
    className
  )
}

export { Button, buttonVariants }
export type { ButtonProps, ButtonVariant, ButtonSize }
