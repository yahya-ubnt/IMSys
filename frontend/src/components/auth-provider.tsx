"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo } from "react"
import { fetchApi } from "@/lib/api"

interface User {
  name: string
  email: string
  roles: string[]
  loginMethod: string
  avatar?: string
  tenant?: {
    _id: string;
    name: string;
  };
}

interface AuthContextType {
  user: User | null
  token: string | null // Add token to the context
  login: (userData: Omit<User, 'name' | 'roles'> & { fullName: string; roles: string[], tenant?: { _id: string; name: string; } }) => void
  logout: () => Promise<void>
  isLoading: boolean
  isLoggingOut: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
}

interface UserProfile {
  fullName: string;
  email: string;
  roles: string[];
  tenant?: {
    _id: string;
    name: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null) // Add token state
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token from cookie
        const cookieToken = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        setToken(cookieToken || null);

        const data = await fetchApi<UserProfile>('/users/profile', { token: cookieToken });
        const user: User = {
          name: data.fullName,
          email: data.email,
          roles: data.roles,
          tenant: data.tenant, // Add tenant to the user object
          loginMethod: 'email', // Assuming email login
        };
        setUser(user);
      } catch (error) {
        setUser(null);
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth()
  }, [])

  const login = (userData: Omit<User, 'name' | 'roles'> & { fullName: string; roles: string[], tenant?: { _id: string; name: string; } }) => {
    const { fullName, ...rest } = userData
    const user: User = { ...rest, name: fullName, roles: userData.roles, tenant: userData.tenant, loginMethod: 'email' }
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

  const isSuperAdmin = useMemo(() => user?.roles.includes('SUPER_ADMIN') ?? false, [user]);
  const isAdmin = useMemo(() => user?.roles.includes('ADMIN') ?? false, [user]);

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading, isLoggingOut, isSuperAdmin, isAdmin }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}