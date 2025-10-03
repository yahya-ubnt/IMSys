"use client"

import { useState } from "react"
import { Topbar } from "@/components/topbar"
import {
  StyledTabsRoot,
  StyledTabsContent,
} from "@/components/ui/StyledTabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Settings, CreditCard } from "lucide-react"
import MpesaSettingsPage from "./mpesa/page"

export default function MainSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "mpesa", label: "M-Pesa", icon: CreditCard },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-400">
            Manage your application's configuration and payment integrations.
          </p>
        </div>
        <StyledTabsRoot
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          <StyledTabsContent value="general" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  General application settings will be managed here in the future.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>This section is under construction.</p>
              </CardContent>
            </Card>
          </StyledTabsContent>
          <StyledTabsContent value="mpesa" className="mt-4">
            <MpesaSettingsPage />
          </StyledTabsContent>
        </StyledTabsRoot>
      </div>
    </div>
  )
}