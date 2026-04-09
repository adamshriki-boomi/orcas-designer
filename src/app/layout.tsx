import type { Metadata } from "next"
import { Poppins, Noto_Sans, Fira_Mono } from "next/font/google"
import "./globals.css"

import { ExosphereProvider } from "@/components/exosphere-provider"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthProvider } from "@/contexts/auth-context"
import { AppShell } from "@/components/layout/app-shell"

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const firaMono = Fira_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Orcas Designer",
  description: "Visual prompt-chain designer for building AI agent skills",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var r=window.location.search.match(/[?&]redirect=([^&]*)/);if(r){var b=${JSON.stringify(process.env.NEXT_PUBLIC_BASE_PATH)};var p=decodeURIComponent(r[1]);window.history.replaceState(null,null,b+p)}})();`,
          }}
        />
      </head>
      <body className={`${poppins.variable} ${notoSans.variable} ${firaMono.variable} font-sans antialiased`}>
        <ExosphereProvider>
          <AuthProvider>
            <AppShell>
              <ErrorBoundary>{children}</ErrorBoundary>
            </AppShell>
            <Toaster />
          </AuthProvider>
        </ExosphereProvider>
      </body>
    </html>
  )
}
