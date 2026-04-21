"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
type ExoInputType = "currency" | "phone" | "number" | "password" | "text" | "email" | "tel" | "search" | "date" | "datetime-local" | "hidden" | "month" | "time" | "url" | "week"

const ExInputLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExInput })),
  { ssr: false }
)

interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  label?: string
  leadingIcon?: string
  clearable?: boolean
  size?: "medium" | "large"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type, placeholder, value, onChange, disabled, id, name, label, size, leadingIcon, clearable, ...props }, ref) {
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
            // The ExInput Lit property is the source of truth — on clear/typing it's
            // set BEFORE Lit re-renders the shadow DOM, so the inner <input> can be
            // stale. Fall back to the native input only if the host value is missing.
            const hostVal = (host as HTMLInputElement).value
            const nativeVal = host.shadowRoot?.querySelector?.("input")?.value
            const val = typeof hostVal === "string" ? hostVal : nativeVal ?? ""
            onChange({ target: { value: val } } as unknown as React.ChangeEvent<HTMLInputElement>)
          }
        }}
        className={cn(className)}
        {...({ ...(size ? { size } : {}), ...(leadingIcon ? { leadingIcon } : {}), ...(clearable ? { clearable } : {}) } as Record<string, unknown>)}
        {...(props as Record<string, unknown>)}
      />
    )
  }
)

export { Input }
