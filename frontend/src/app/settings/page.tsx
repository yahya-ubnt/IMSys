'use client'

import { useState } from "react"
import { Topbar } from "@/components/topbar"
import {
  StyledTabs,
  StyledTabsList,
  StyledTabsTrigger,
} from "@/components/ui/StyledTabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, CreditCard, MessageSquare, MessageCircle, Bell } from "lucide-react"
import MpesaSettingsPage from "./mpesa/page"
import SmsSettingsPage from "./sms/page"
import WhatsAppSettingsPage from "./whatsapp/page"
import GeneralSettingsForm from "./general/page"
import EmailSettingsPage from "./email/page"

export default function MainSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "mpesa", label: "M-Pesa", icon: CreditCard },
    { id: "sms", label: "SMS", icon: MessageSquare },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { id: "email", label: "Email", icon: Bell },
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

        {/* Mobile Dropdown */}
        <div className="sm:hidden">
          <Card className="bg-zinc-900/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-base text-blue-500">Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 focus:ring-cyan-500">
                  <SelectValue placeholder="Select a setting" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                  {tabs.map((tab) => (
                    <SelectItem key={tab.id} value={tab.id}>
                      <div className="flex items-center">
                        {tab.icon && <tab.icon className="w-4 h-4 mr-2" />}
                        {tab.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:block">
          <StyledTabs value={activeTab} onValueChange={setActiveTab}>
            <StyledTabsList>
              {tabs.map((tab) => (
                <StyledTabsTrigger key={tab.id} value={tab.id}>
                  {tab.icon && <tab.icon className="w-4 h-4 mr-2" />}
                  {tab.label}
                </StyledTabsTrigger>
              ))}
            </StyledTabsList>
          </StyledTabs>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'general' && (
            <div className="flex justify-center"><div className="w-full max-w-3xl"><GeneralSettingsForm /></div></div>
          )}
          {activeTab === 'mpesa' && (
            <div className="flex justify-center"><div className="w-full max-w-3xl"><MpesaSettingsPage /></div></div>
          )}
          {activeTab === 'sms' && (
            <div className="flex justify-center"><div className="w-full max-w-3xl"><SmsSettingsPage /></div></div>
          )}
          {activeTab === 'whatsapp' && (
            <div className="flex justify-center"><div className="w-full max-w-3xl"><WhatsAppSettingsPage /></div></div>
          )}
          {activeTab === 'email' && (
            <div className="flex justify-center"><div className="w-full max-w-3xl"><EmailSettingsPage /></div></div>
          )}
        </div>
      </div>
    </div>
  )
}