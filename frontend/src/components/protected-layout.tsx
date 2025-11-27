"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = ["/login", "/register"]
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) {
      router.push("/login")
    }
  }, [isLoading, user, isPublicRoute, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user && !isPublicRoute) {
    return null
  }

  return <>{children}</>
}