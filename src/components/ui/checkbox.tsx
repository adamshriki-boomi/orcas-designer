"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const ExCheckboxLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExCheckbox })),
  { ssr: false }
)

interface CheckboxProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  name?: string
  value?: string
}

function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
  id,
  name,
  value,
  ...props
}: CheckboxProps) {
  return (
    <ExCheckboxLazy
      checked={checked ?? defaultChecked ?? false}
      disabled={disabled || false}
      name={name || ""}
      value={value || ""}
      controlled={checked !== undefined}
      onChange={(e: CustomEvent<{ checked: boolean; value: string }>) => {
        onCheckedChange?.(e.detail.checked)
      }}
      className={cn("cursor-pointer", className)}
      {...(props as Record<string, unknown>)}
    />
  )
}

export { Checkbox }
export type { CheckboxProps }
