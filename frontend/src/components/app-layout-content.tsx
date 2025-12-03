"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileHeader } from "@/components/mobile-header" // Re-Import MobileHeader
import { SidebarProvider } from "@/components/ui/sidebar"
import type React from "react"

interface AppLayoutContentProps {
  children: React.ReactNode
}

export function AppLayoutContent({ children }: AppLayoutContentProps) {
  const pathname = usePathname()
  const hideSidebar = pathname === "/login" || pathname === "/register"

  return (
    <SidebarProvider>
      {!hideSidebar && <AppSidebar />}
      <main className="flex-1 md:pl-[var(--sidebar-width)] md:peer-data-[state=collapsed]:pl-[var(--sidebar-width-icon)] bg-zinc-900 text-white overflow-y-auto transition-[padding-left] duration-200 ease-linear" data-sidebar="content">
        {!hideSidebar && <MobileHeader />} {/* Re-add MobileHeader */}
        {children}
      </main>
    </SidebarProvider>
  )
}