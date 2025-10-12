'use client'

import { useState } from "react"
import { Topbar } from "@/components/topbar"
import {
  StyledTabs,
  StyledTabsContent,
} from "@/components/ui/StyledTabs"
import { Settings, CreditCard, MessageSquare, MessageCircle, Bell } from "lucide-react"
import MpesaSettingsPage from "./mpesa/page"
import SmsSettingsPage from "./sms/page"
import WhatsAppSettingsPage from "./whatsapp/page"
import GeneralSettingsForm from "./general/page"
import EmailSettingsPage from "./email/page" // Import the new page

export default function MainSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "mpesa", label: "M-Pesa", icon: CreditCard },
    { id: "sms", label: "SMS", icon: MessageSquare },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { id: "email", label: "Email", icon: Bell }, // Add new tab
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
        <StyledTabs
          tabs={tabs}
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <StyledTabsContent value="general" className="mt-4">
            <div className="flex justify-center">
              <div className="w-full max-w-3xl">
                <GeneralSettingsForm />
              </div>
            </div>
          </StyledTabsContent>
          <StyledTabsContent value="mpesa" className="mt-4">
            <div className="flex justify-center">
              <div className="w-full max-w-3xl">
                <MpesaSettingsPage />
              </div>
            </div>
          </StyledTabsContent>
          <StyledTabsContent value="sms" className="mt-4">
            <div className="flex justify-center">
              <div className="w-full max-w-3xl">
                <SmsSettingsPage />
              </div>
            </div>
          </StyledTabsContent>
          <StyledTabsContent value="whatsapp" className="mt-4">
            <div className="flex justify-center">
              <div className="w-full max-w-3xl">
                <WhatsAppSettingsPage />
              </div>
            </div>
          </StyledTabsContent>
          {/* Add content for the new tab */}
          <StyledTabsContent value="email" className="mt-4">
            <div className="flex justify-center">
              <div className="w-full max-w-3xl">
                <EmailSettingsPage />
              </div>
            </div>
          </StyledTabsContent>
        </StyledTabs>
      </div>
    </div>
  )
}