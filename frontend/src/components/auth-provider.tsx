"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  name: string
  email: string
  role: string
  loginMethod: string
  avatar?: string
  // token?: string; // Token will now be managed separately in context
}

interface AuthContextType {
  user: User | null
  token: string | null; // Explicitly add token to context type
  login: (userData: User & { token?: string }) => void // Allow token in login data
  logout: () => void
  isLoading: boolean
  isLoggingOut: boolean; // New state for logout in progress
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null); // New token state
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false); // New state

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const isLoggedIn = localStorage.getItem("isLoggedIn")
        const userData = localStorage.getItem("user")
        const storedToken = localStorage.getItem("token") // Get token from localStorage

        if (isLoggedIn === "true" && userData) {
          try {
            const parsedUser: User = JSON.parse(userData);
            setUser(parsedUser);
            setToken(storedToken); // Set token state
          } catch (error) {
            console.error("Error parsing user data:", error)
            localStorage.removeItem("isLoggedIn")
            localStorage.removeItem("user")
            localStorage.removeItem("token")
          }
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = (userData: User & { token?: string }) => {
    console.log("User data in login:", userData);
    setIsLoggingOut(false); // Reset on login
    setUser(userData)
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("user", JSON.stringify(userData))
    if (userData.token) {
      localStorage.setItem("token", userData.token)
      setToken(userData.token); // Set token state on login
    }
  }

  const logout = () => {
    setIsLoggingOut(true); // Set logging out state
    setUser(null)
    setToken(null); // Clear token state on logout
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading, isLoggingOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}