"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const ExTextareaLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExTextarea })),
  { ssr: false }
)

interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string
}

function Textarea({ className, placeholder, value, onChange, disabled, rows, label, ...props }: TextareaProps) {
  return (
    <ExTextareaLazy
      placeholder={placeholder || ""}
      value={typeof value === "string" ? value : ""}
      disabled={disabled || false}
      rows={rows || 4}
      {...(label ? { label } : {})}
      onInput={(e: Event) => {
        if (onChange) {
          const host = e.target as HTMLElement
          const nativeTextarea = host.shadowRoot?.querySelector?.("textarea")
          const val = nativeTextarea?.value ?? (host as HTMLTextAreaElement).value ?? ""
          onChange({ target: { value: val } } as unknown as React.ChangeEvent<HTMLTextAreaElement>)
        }
      }}
      className={cn(className)}
      {...(props as Record<string, unknown>)}
    />
  )
}

export { Textarea }
