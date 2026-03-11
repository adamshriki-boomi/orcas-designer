"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const ExToggleLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExToggle })),
  { ssr: false }
)

interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
  size?: "sm" | "default"
}

function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
  id,
  size = "default",
  ...props
}: SwitchProps) {
  const isControlled = checked !== undefined

  return (
    <ExToggleLazy
      on={checked ?? defaultChecked ?? false}
      disabled={disabled || false}
      controlled={isControlled}
      size={size === "sm" ? "small" : "default"}
      onChange={(e: CustomEvent<{ detail: boolean }>) => {
        // ExToggle fires CustomEvent where the actual boolean is nested in detail.detail
        const value = typeof e.detail === 'boolean' ? e.detail : (e.detail as { detail: boolean }).detail;
        onCheckedChange?.(value)
      }}
      className={cn("cursor-pointer", className)}
      {...(props as Record<string, unknown>)}
    />
  )
}

export { Switch }
export type { SwitchProps }
