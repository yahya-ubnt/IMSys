"use client"

import { Bell, Search, Settings, User, LogOut, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import NotificationBell from "./notifications/NotificationBell"
import { SidebarTrigger } from "@/components/ui/sidebar" // Import SidebarTrigger
import Image from "next/image" // Import Image
import { useSettings } from "@/hooks/use-settings" // Import useSettings
import { Wifi } from "lucide-react" // Import Wifi icon for default logo

export function Topbar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { settings } = useSettings() // Use settings for app name/logo

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleProfileClick = () => {
    router.push("/settings")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b" style={{
      backgroundColor: 'var(--sidebar)',
      borderColor: 'var(--sidebar-border)',
    }}>
      <div className="flex h-16 items-center justify-between gap-4 px-4">
        {/* Left Group: Hamburger (mobile) + Search (responsive) */}
        <div className="flex items-center gap-2">
          {/* Hamburger (mobile only) */}
          <div className="md:hidden">
            <SidebarTrigger />
          </div>

          {/* Search Bar (responsive width) */}
          <div className="relative flex-1 w-full sm:w-auto sm:max-w-md sm:flex-1 ml-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search users, packages, devices..."
              className="pl-8 rounded-full"
              style={{
                backgroundColor: 'var(--input)',
                color: 'var(--foreground)',
                borderColor: 'var(--border)',
              }}
            />
          </div>
        </div>

        {/* Right Group: Icons (profile, bell, theme) */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9" style={{ color: 'var(--muted-foreground)' }}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    {user?.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount style={{
              backgroundColor: 'var(--sidebar)',
              color: 'var(--popover-foreground)',
              borderColor: 'var(--sidebar-border)',
            }}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "Admin User"}</p>
                  <p className="text-xs leading-none" style={{ color: 'var(--muted-foreground)' }}>{user?.email || "admin@mediatek.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: 'var(--sidebar-border)' }} />
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: 'var(--sidebar-border)' }} />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer" style={{ color: 'var(--destructive)' }}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}