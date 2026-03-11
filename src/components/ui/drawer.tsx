"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const ExSideDrawerLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExSideDrawer })),
  { ssr: false }
)

interface DrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  direction?: "right" | "left" | "top" | "bottom"
  children?: React.ReactNode
}

const DrawerContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>({ open: false, onOpenChange: () => {} })

function Drawer({ open = false, onOpenChange, direction, children, ...props }: DrawerProps) {
  return (
    <DrawerContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </DrawerContext.Provider>
  )
}

function DrawerTrigger({ children, className, ...props }: React.ComponentProps<"button">) {
  const { onOpenChange } = React.useContext(DrawerContext)
  return (
    <button
      type="button"
      className={cn("cursor-pointer", className)}
      onClick={() => onOpenChange(true)}
      {...props}
    >
      {children}
    </button>
  )
}

function DrawerPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return null
}

function DrawerClose({ children, className, asChild, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DrawerContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: (e: React.MouseEvent) => {
        onOpenChange(false)
        const childOnClick = (children as React.ReactElement<Record<string, unknown>>).props?.onClick
        if (typeof childOnClick === "function") childOnClick(e)
      },
    })
  }

  return (
    <button
      type="button"
      className={cn("cursor-pointer", className)}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children}
    </button>
  )
}

function DrawerContent({
  className,
  children,
  width,
  ...props
}: React.ComponentProps<"div"> & { width?: "25" | "50" | "75" | "default" }) {
  const { open, onOpenChange } = React.useContext(DrawerContext)

  // Extract title and partition children by component type
  const { title, footerContent, bodyChildren } = React.useMemo(() => {
    let foundTitle = ""
    let footer: React.ReactNode = null
    const body: React.ReactNode[] = []

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        body.push(child)
        return
      }
      const p = child.props as Record<string, unknown>
      if (child.type === DrawerHeader) {
        // Extract title from header children
        React.Children.forEach(p.children as React.ReactNode, (headerChild: React.ReactNode) => {
          if (React.isValidElement(headerChild) && headerChild.type === DrawerTitle) {
            foundTitle = String((headerChild.props as Record<string, unknown>).children || "")
          }
        })
        return // Don't render header — ExSideDrawer handles it via panelTitle
      }
      if (child.type === DrawerFooter) {
        footer = p.children as React.ReactNode
        return
      }
      body.push(child)
    })
    return { title: foundTitle, footerContent: footer, bodyChildren: body }
  }, [children])

  return (
    <ExSideDrawerLazy
      panelTitle={title || ""}
      open={open}
      onClose={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      className={cn(className)}
      resize={true}
      footer={!!footerContent}
      {...(width !== undefined ? { width } : {})}
      {...(props as Record<string, unknown>)}
    >
      {bodyChildren}
      {footerContent && <div slot="footer">{footerContent}</div>}
    </ExSideDrawerLazy>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="drawer-title"
      className={cn("text-base font-medium text-foreground", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
