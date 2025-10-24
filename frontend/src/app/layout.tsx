"use client"

import type React from "react"
import { useEffect } from "react" // Import useEffect
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { AuthProvider, useAuth } from "@/components/auth-provider" // Assuming useAuth is exported
import { ProtectedLayout } from "@/components/protected-layout"
import { ThemeProvider } from "@/components/theme-provider"
import { AppLayoutContent } from "@/components/app-layout-content"
import { Toaster } from "@/components/ui/toaster"
import { SettingsProvider } from "@/hooks/use-settings"
import { NotificationProvider } from "../context/NotificationContext" // Import NotificationProvider

const inter = Inter({ subsets: ["latin"] })


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
              <NotificationProvider> {/* Wrap with NotificationProvider */}
                <ProtectedLayout>
                  <AppLayoutContent>{children}</AppLayoutContent>
                </ProtectedLayout>
              </NotificationProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}