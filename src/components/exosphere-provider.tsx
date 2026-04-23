'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'

export function ExosphereProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register Exosphere web components (client-only)
    import('@boomi/exosphere').then((m) => {
      if (typeof m.default === 'function') m.default()
    })
    // Icon registry — the canonical public entry point (per exosphere skill).
    // Missing this → every icon renders as a silent empty box.
    import('@boomi/exosphere/dist/icon.js')
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      value={{ light: 'ex-theme-light', dark: 'ex-theme-dark' }}
    >
      {children}
    </ThemeProvider>
  )
}
