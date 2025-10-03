"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"

interface StyledTab {
  id: string
  label: string
  icon?: React.ElementType
}

interface StyledTabsProps {
  tabs: StyledTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children: React.ReactNode
}

export const StyledTabsRoot = ({
  tabs,
  activeTab,
  onTabChange,
  children,
}: StyledTabsProps) => {
  return (
    <TabsPrimitive.Root value={activeTab} onValueChange={onTabChange}>
      <TabsPrimitive.List className="relative flex w-full items-center justify-start border-b border-zinc-800 p-2">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.id}
            value={tab.id}
            className="relative px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors focus-visible:outline-none data-[state=active]:text-white"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-setting-tab-indicator"
                className="absolute inset-0 bg-zinc-700/50 rounded-md"
              />
            )}
            <span className="relative z-10 flex items-center">
              {tab.icon && <tab.icon className="mr-2 h-4 w-4" />}
              {tab.label}
            </span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  )
}

export const StyledTabsContent = TabsPrimitive.Content
