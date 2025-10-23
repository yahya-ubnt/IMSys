"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  name: string
  email: string
  roles: string[]
  loginMethod: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (userData: Omit<User, 'name' | 'roles'> & { fullName: string; roles: string[] }) => void
  logout: () => void
  isLoading: boolean
  isLoggingOut: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const isLoggedIn = localStorage.getItem("isLoggedIn")
        const userData = localStorage.getItem("user")

        if (isLoggedIn === "true" && userData) {
          try {
            const parsedUser: User = JSON.parse(userData)
            setUser(parsedUser)
          } catch (error) {
            console.error("Error parsing user data:", error)
            localStorage.removeItem("isLoggedIn")
            localStorage.removeItem("user")
          }
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = (userData: Omit<User, 'name' | 'roles'> & { fullName: string; roles: string[] }) => {
    console.log("User data in login:", userData)
    const { fullName, ...rest } = userData
    const user: User = { ...rest, name: fullName, roles: userData.roles, loginMethod: 'email' }
    setIsLoggingOut(false)
    setUser(user)
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("user", JSON.stringify(user))
  }

  const logout = () => {
    setIsLoggingOut(true); // Set logging out state
    setUser(null)
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading, isLoggingOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}