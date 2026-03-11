"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const ExDialogLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExDialog })),
  { ssr: false }
)

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
})

function Dialog({
  open,
  onOpenChange,
  children,
  ...props
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ children, className, ...props }: React.ComponentProps<"button">) {
  const { onOpenChange } = React.useContext(DialogContext)
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

function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DialogClose({ children, className, render, ...props }: React.ComponentProps<"button"> & { render?: React.ReactElement }) {
  const { onOpenChange } = React.useContext(DialogContext)

  if (render && React.isValidElement(render)) {
    return React.cloneElement(render as React.ReactElement<Record<string, unknown>>, {
      onClick: () => onOpenChange(false),
      children,
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

function DialogOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return null
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  const { open, onOpenChange } = React.useContext(DialogContext)

  // Extract title and partition children by component type
  const { title, headerContent, footerContent, bodyChildren } = React.useMemo(() => {
    let foundTitle = ""
    let header: React.ReactNode = null
    let footer: React.ReactNode = null
    const body: React.ReactNode[] = []

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        body.push(child)
        return
      }
      const p = child.props as Record<string, unknown>
      if (child.type === DialogHeader) {
        React.Children.forEach(p.children as React.ReactNode, (headerChild: React.ReactNode) => {
          if (React.isValidElement(headerChild) && headerChild.type === DialogTitle) {
            foundTitle = String((headerChild.props as Record<string, unknown>).children || "")
          }
        })
        header = p.children as React.ReactNode
        return
      }
      if (child.type === DialogFooter) {
        footer = p.children as React.ReactNode
        return
      }
      body.push(child)
    })
    return { title: foundTitle, headerContent: header, footerContent: footer, bodyChildren: body }
  }, [children])

  return (
    <ExDialogLazy
      dialogTitle={title || ""}
      open={open}
      hideClose={!showCloseButton}
      onCancel={() => onOpenChange(false)}
      className={cn(className)}
      {...(props as Record<string, unknown>)}
    >
      <div slot="content">
        {headerContent}
        {bodyChildren}
      </div>
      {footerContent && <div slot="footer">{footerContent}</div>}
    </ExDialogLazy>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext)
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex gap-2 sm:justify-end", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      )}
    </div>
  )
}

function DialogTitle({ className, children, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props}
    >
      {children}
    </h3>
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
