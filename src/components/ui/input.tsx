"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
type ExoInputType = "currency" | "phone" | "number" | "password" | "text" | "email" | "tel" | "search" | "date" | "datetime-local" | "hidden" | "month" | "time" | "url" | "week"

const ExInputLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExInput })),
  { ssr: false }
)

interface InputProps extends React.ComponentProps<"input"> {
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type, placeholder, value, onChange, disabled, id, name, label, ...props }, ref) {
    // File inputs must use native <input> — ExInput doesn't support file type,
    // and consumers need ref access for .value = '' and .click()
    if (type === "file") {
      return (
        <input
          ref={ref}
          type="file"
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          id={id}
          name={name}
          {...props}
        />
      )
    }

    return (
      <ExInputLazy
        type={(type || "text") as ExoInputType}
        placeholder={placeholder || ""}
        value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
        disabled={disabled || false}
        name={name || ""}
        {...(label ? { label } : {})}
        onInput={(e: Event) => {
          if (onChange) {
            const host = e.target as HTMLElement
            // Pierce shadow DOM to find the native input, or use the host's value property
            const nativeInput = host.shadowRoot?.querySelector?.("input")
            const val = nativeInput?.value ?? (host as HTMLInputElement).value ?? ""
            onChange({ target: { value: val } } as unknown as React.ChangeEvent<HTMLInputElement>)
          }
        }}
        className={cn(className)}
        {...(props as Record<string, unknown>)}
      />
    )
  }
)

export { Input }
