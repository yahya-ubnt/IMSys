import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { AuthProvider } from "@/components/auth-provider"
import { ProtectedLayout } from "@/components/protected-layout"
import { ThemeProvider } from "@/components/theme-provider"
import { AppLayoutContent } from "@/components/app-layout-content"
import { Toaster } from "@/components/ui/toaster"
import { SettingsProvider } from "@/hooks/use-settings"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MEDIATEK MANAGEMENT SYSTEM",
  description: "A comprehensive sales CRM for managing buildings, units, caretakers, and leads",
}

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <AuthProvider>
            <SettingsProvider>
              <ProtectedLayout>
                <AppLayoutContent>{children}</AppLayoutContent>
              </ProtectedLayout>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}