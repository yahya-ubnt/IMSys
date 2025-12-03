"use client"

import * as React from "react"
import Image from "next/image"
import { Wifi } from "lucide-react"

import { useSettings } from "@/hooks/use-settings"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function MobileHeader() {
  const { settings } = useSettings()

  return (
    <header className="md:hidden flex items-center justify-start px-4 py-2 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10 gap-4">
      <SidebarTrigger />
      <div className="flex items-center gap-3">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg">
          {settings.logoIcon && settings.logoIcon.startsWith('/') ? (
            <Image src={settings.logoIcon} alt="Logo" width={18} height={18} className="size-4" />
          ) : (
            <Wifi className="size-4" />
          )}
        </div>
        <span className="truncate font-bold text-md text-blue-400">
          {settings.appName}
        </span>
      </div>
    </header>
  )
}