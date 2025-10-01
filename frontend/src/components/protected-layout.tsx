"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"


interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const isLoggedIn = localStorage.getItem("isLoggedIn")
        const publicRoutes = ["/login", "/register"]

        if (publicRoutes.includes(pathname)) {
          // If user is on a public route, don't show sidebar
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }

        if (isLoggedIn === "true") {
          setIsAuthenticated(true)
        } else {
          router.push("/login")
          return
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // For public routes (login/register), render without sidebar
  if (!isAuthenticated) {
    return <>{children}</>
  }

  // For protected routes, render with sidebar
  return <>{children}</>
}
