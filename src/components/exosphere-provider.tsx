'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'

export function ExosphereProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register Exosphere web components (client-only)
    import('@boomi/exosphere').then((m) => {
      if (typeof m.default === 'function') m.default()
    })
    // Load icon registry (populates window[Symbol.for("$$EXOSPHERE_ICON$$")])
    import('@boomi/exosphere/dist/components/icon/icons/index.js')
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
