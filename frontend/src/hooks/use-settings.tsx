"use client"

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';

interface Settings {
  appName: string;
  slogan: string;
  logoIcon: string | null;
}

interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>({
    appName: "MEDIATEK",
    slogan: "MANAGEMENT SYSTEM",
    logoIcon: null,
  });
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/general", { credentials: 'include', signal });
        if (response.ok) {
          const data = await response.json();
          setSettings({
            appName: data.appName || "MEDIATEK",
            slogan: data.slogan || "MANAGEMENT SYSTEM",
            logoIcon: data.logoIcon,
          });
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Failed to fetch settings:", error);
        }
      }
    };

    if (!isLoading && user) {
      fetchSettings();
    }

    return () => {
      abortController.abort();
    };
  }, [isLoading, user]);

  // Reset settings on logout
  useEffect(() => {
    if (!isLoading && !user) {
      setSettings({
        appName: "MEDIATEK",
        slogan: "MANAGEMENT SYSTEM",
        logoIcon: null,
      });
    }
  }, [isLoading, user]);

  const contextValue = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
