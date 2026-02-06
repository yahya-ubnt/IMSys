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
      <main className={`flex-1 bg-zinc-900 text-white overflow-y-auto transition-[padding-left] duration-200 ease-linear ${!hideSidebar ? 'md:pl-[var(--sidebar-width)] md:peer-data-[state=collapsed]:pl-[var(--sidebar-width-icon)]' : ''}`} data-sidebar="content">
        {children}
      </main>
    </SidebarProvider>
  )
}