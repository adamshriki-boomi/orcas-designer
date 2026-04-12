"use client"

import dynamic from "next/dynamic"
import type { LoaderVariant, SpinnerSize } from "@boomi/exosphere"
import { cn } from "@/lib/utils"

const ExLoaderLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExLoader })),
  { ssr: false }
)

export function SectionLoader({ label = "Loading...", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <ExLoaderLazy
        variant={"spinner" as LoaderVariant}
        spinnerSize={"medium" as SpinnerSize}
        label={label}
      />
    </div>
  )
}
