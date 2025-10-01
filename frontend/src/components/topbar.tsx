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

export function Topbar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleLogout = () => {
    router.push("/login")
    logout()
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleProfileClick = () => {
    router.push("/settings")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-blue-500 bg-zinc-950">
      <div className="flex h-16 items-center gap-4 px-2">

        <div className="flex-1 flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
            <Input
              placeholder="Search buildings, units, caretakers..."
              className="pl-8 bg-zinc-800 text-zinc-200 border-zinc-700 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button variant="outline" size="icon" onClick={toggleTheme} className="h-9 w-9 border-blue-500 text-blue-400 hover:bg-blue-900 hover:text-white">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button variant="outline" size="icon" className="h-9 w-9 border-blue-500 text-blue-400 hover:bg-blue-900 hover:text-white">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative h-9 w-9 rounded-full border-blue-500 hover:bg-blue-900">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                    {user?.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-900 text-zinc-200 border-zinc-700" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-blue-400">{user?.name || "Admin User"}</p>
                  <p className="text-xs leading-none text-zinc-400">{user?.email || "admin@mediatek.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer hover:bg-zinc-800">
                <User className="mr-2 h-4 w-4 text-blue-400" />
                <span className="text-zinc-200">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer hover:bg-zinc-800">
                <Settings className="mr-2 h-4 w-4 text-blue-400" />
                <span className="text-zinc-200">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 hover:bg-zinc-800">
                <LogOut className="mr-2 h-4 w-4 text-red-500" />
                <span className="text-red-500">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
