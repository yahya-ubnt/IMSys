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
  logout: () => Promise<void>
  isLoading: boolean
  isLoggingOut: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/profile');
        if (response.ok) {
          const data = await response.json();
          const user: User = {
            name: data.fullName,
            email: data.email,
            roles: data.roles,
            loginMethod: 'email', // Assuming email login
          };
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth()
  }, [])

  const login = (userData: Omit<User, 'name' | 'roles'> & { fullName: string; roles: string[] }) => {
    console.log("User data in login:", userData)
    const { fullName, ...rest } = userData
    const user: User = { ...rest, name: fullName, roles: userData.roles, loginMethod: 'email' }
    setIsLoggingOut(false)
    setUser(user)
  }

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/users/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsLoggingOut(false);
    }
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