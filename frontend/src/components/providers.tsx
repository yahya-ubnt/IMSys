"use client";

import type React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { ProtectedLayout } from "@/components/protected-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayoutContent } from "@/components/app-layout-content";
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from "@/hooks/use-settings";
import { NotificationProvider } from "../context/NotificationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <AuthProvider>
        <SettingsProvider>
          <NotificationProvider>
            <ProtectedLayout>
              <AppLayoutContent>{children}</AppLayoutContent>
            </ProtectedLayout>
          </NotificationProvider>
        </SettingsProvider>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
}
