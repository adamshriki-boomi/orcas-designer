"use client"

import * as React from "react"
import dynamic from "next/dynamic"

const ExAlertToastLazy = dynamic(
  () => import("@boomi/exosphere").then((m) => ({ default: m.ExAlertToast })),
  { ssr: false }
)

let toastControllerReady = false
let pendingInit: (() => void)[] = []

function initializeToastController() {
  if (toastControllerReady) return
  import("@boomi/exosphere").then(({ ToastController }) => {
    ToastController.initialize()
    toastControllerReady = true
    pendingInit.forEach((fn) => fn())
    pendingInit = []
  })
}

export function toast(message: string, options?: { type?: "info" | "success" | "warning" | "error"; description?: string }) {
  const type = options?.type || "info"
  const typeMap = {
    info: "Information",
    success: "Success",
    warning: "Warning",
    error: "Error",
  } as const

  const show = () => {
    import("@boomi/exosphere").then(({ ToastController, AlertToastType }) => {
      ToastController.show({
        type: typeMap[type] as unknown as typeof AlertToastType[keyof typeof AlertToastType],
        description: message,
      })
    })
  }

  if (toastControllerReady) {
    show()
  } else {
    initializeToastController()
    pendingInit.push(show)
  }
}

toast.success = (message: string) => toast(message, { type: "success" })
toast.error = (message: string) => toast(message, { type: "error" })
toast.warning = (message: string) => toast(message, { type: "warning" })
toast.info = (message: string) => toast(message, { type: "info" })

function Toaster() {
  React.useEffect(() => {
    initializeToastController()
  }, [])

  return <ExAlertToastLazy />
}

export { Toaster }
