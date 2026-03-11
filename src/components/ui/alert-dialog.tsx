"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const ExDialogLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExDialog })),
  { ssr: false }
)

interface AlertDialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextValue>({
  open: false,
  onOpenChange: () => {},
})

function getTextContent(children: React.ReactNode): string {
  if (typeof children === "string") return children
  if (typeof children === "number") return String(children)
  if (Array.isArray(children)) return children.map(getTextContent).join("")
  if (React.isValidElement(children))
    return getTextContent((children.props as Record<string, unknown>).children as React.ReactNode)
  return ""
}

function AlertDialog({
  open,
  onOpenChange,
  children,
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
    <AlertDialogContext.Provider value={{ open: isOpen, onOpenChange: setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

function AlertDialogTrigger({ children, className, ...props }: React.ComponentProps<"button">) {
  const { onOpenChange } = React.useContext(AlertDialogContext)
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

function AlertDialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function AlertDialogOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return null
}

function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, onOpenChange } = React.useContext(AlertDialogContext)

  const { titleText, descriptionContent, footerContent } = React.useMemo(() => {
    let title = ""
    let description: React.ReactNode = null
    let footer: React.ReactNode = null

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      if (child.type === AlertDialogHeader) {
        React.Children.forEach(
          (child.props as Record<string, unknown>).children as React.ReactNode,
          (headerChild) => {
            if (!React.isValidElement(headerChild)) return
            if (headerChild.type === AlertDialogTitle) {
              title = getTextContent(
                (headerChild.props as Record<string, unknown>).children as React.ReactNode
              )
            } else if (headerChild.type === AlertDialogDescription) {
              description = (headerChild.props as Record<string, unknown>)
                .children as React.ReactNode
            }
          }
        )
      } else if (child.type === AlertDialogFooter) {
        footer = (child.props as Record<string, unknown>).children as React.ReactNode
      }
    })
    return { titleText: title, descriptionContent: description, footerContent: footer }
  }, [children])

  return (
    <ExDialogLazy
      open={open}
      onCancel={() => onOpenChange(false)}
      dialogTitle={titleText}
      // ExDialog expects headerContent as undefined for no header icon, but passing
      // "warning" shows a warning icon. The type mismatch is because ExDialog's TS
      // definition doesn't include "warning" as a valid string, so we cast through unknown.
      headerContent={"warning" as unknown as undefined}
      staticBackdrop={true}
      animated={true}
    >
      {descriptionContent && (
        <p className="text-sm text-muted-foreground">{descriptionContent}</p>
      )}
      {footerContent && (
        <div slot="footer" className="flex gap-2 justify-end">
          {footerContent}
        </div>
      )}
    </ExDialogLazy>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("grid place-items-center gap-1.5 text-center sm:place-items-start sm:text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("flex gap-2 sm:justify-end", className)}
      {...props}
    />
  )
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn("mb-2 inline-flex size-10 items-center justify-center rounded-md bg-muted *:[svg:not([class*='size-'])]:size-6", className)}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="alert-dialog-title"
      className={cn("text-base font-medium", className)}
      {...props}
    >
      {children}
    </h3>
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-dialog-description"
      className={cn("text-sm text-balance text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="alert-dialog-action"
      className={cn(className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { onOpenChange } = React.useContext(AlertDialogContext)
  return (
    <Button
      data-slot="alert-dialog-cancel"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={(e) => {
        onOpenChange(false)
        if (onClick) onClick(e)
      }}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
