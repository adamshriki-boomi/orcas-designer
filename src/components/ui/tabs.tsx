"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const ExTabLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExTab })),
  { ssr: false }
)
const ExTabItemLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExTabItem })),
  { ssr: false }
)

interface TabsContextValue {
  selectedValue: string
  setSelectedValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function Tabs({
  className,
  defaultValue,
  value,
  onValueChange,
  children,
}: {
  defaultValue?: string | number
  value?: string | number
  onValueChange?: (value: string) => void
  className?: string
  children?: React.ReactNode
}) {
  const [internalValue, setInternalValue] = React.useState(String(defaultValue ?? ""))
  const selectedValue = value !== undefined ? String(value) : internalValue

  const setSelectedValue = React.useCallback((val: string) => {
    setInternalValue(val)
    onValueChange?.(val)
  }, [onValueChange])

  const ctx = React.useMemo(() => ({ selectedValue, setSelectedValue }), [selectedValue, setSelectedValue])

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("flex flex-col gap-4", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const ctx = React.useContext(TabsContext)

  // Extract value+label from TabsTrigger children
  const tabItems = React.useMemo(() => {
    const items: { value: string; label: React.ReactNode }[] = []
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === TabsTrigger) {
        const p = child.props as { value?: string | number; children?: React.ReactNode }
        items.push({ value: String(p.value ?? ""), label: p.children })
      }
    })
    return items
  }, [children])

  const selectedIndex = tabItems.findIndex((t) => t.value === ctx?.selectedValue)

  return (
    <ExTabLazy
      onSelect={(e: CustomEvent<{ index: number }>) => {
        // ExTab's TS type says `index` but the actual runtime event fires `selectedIndex`.
        // We read both to be safe across Exosphere versions.
        const detail = e.detail as { index?: number; selectedIndex?: number };
        const idx = detail.selectedIndex ?? detail.index ?? 0;
        const item = tabItems[idx];
        if (item) ctx?.setSelectedValue(item.value);
      }}
    >
      {tabItems.map((item, index) => (
        <ExTabItemLazy
          key={item.value}
          selected={index === selectedIndex}
        >
          {item.label}
        </ExTabItemLazy>
      ))}
    </ExTabLazy>
  )
}

// TabsTrigger is a data-only component — TabsList extracts its props
function TabsTrigger({
  value,
  children,
  ...props
}: React.ComponentProps<"button"> & { value?: string | number }) {
  return null
}

function TabsContent({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<"div"> & { value?: string | number }) {
  const ctx = React.useContext(TabsContext)
  const isActive = ctx?.selectedValue === String(value)
  if (!isActive) return null
  return (
    <div
      role="tabpanel"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
