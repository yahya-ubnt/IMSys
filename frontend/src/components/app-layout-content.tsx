"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
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
      <main className="flex-1 md:pl-[var(--sidebar-width)] bg-zinc-900 text-white overflow-y-auto" data-sidebar="content">
        {children}
      </main>
    </SidebarProvider>
  )
}