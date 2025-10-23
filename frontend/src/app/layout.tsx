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
import { initSocket, disconnectSocket, getSocket } from "../services/socketService" // Adjust path as needed
import { useToast } from "@/hooks/use-toast" // Correct import for toast
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
                <SocketInitializer> {/* New component to handle socket logic */}
                  <ProtectedLayout>
                    <AppLayoutContent>{children}</AppLayoutContent>
                  </ProtectedLayout>
                </SocketInitializer>
              </NotificationProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}

// New component to encapsulate socket initialization and event listening
function SocketInitializer({ children }: { children: React.ReactNode }) {
  const { toast } = useToast(); // Get toast function

  useEffect(() => {
    initSocket();
    const socket = getSocket();

    socket.on('new_notification', (notification: any) => {
      toast({
        title: "New Notification",
        description: notification.message,
      });
      // You might also want to update a global state for notification count/list here
    });

    return () => {
      socket.off('new_notification');
      disconnectSocket();
    };
  }, [toast]); // Add toast to dependency array

  return <>{children}</>;
}