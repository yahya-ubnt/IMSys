"use client"

import { Topbar } from "@/components/topbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandingSettingsForm } from "./_components/branding-settings-form"
import { MpesaPaybillForm } from "./_components/mpesa-paybill-form"
import { MpesaTillForm } from "./_components/mpesa-till-form"
import { motion } from "framer-motion"

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Settings
          </h1>
          <p className="text-sm text-zinc-400">
            Manage your application settings and preferences.
          </p>
        </motion.div>

        <Tabs defaultValue="payment-gateway" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50 backdrop-blur-lg border border-zinc-800 rounded-lg">
            <TabsTrigger value="payment-gateway">Payment Gateway</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="security" disabled>
              Security
            </TabsTrigger>
          </TabsList>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <TabsContent value="payment-gateway" className="mt-4">
              <Tabs defaultValue="paybill" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-800/60 backdrop-blur-lg border border-zinc-700 rounded-lg">
                  <TabsTrigger value="paybill">M-Pesa Pay Bill</TabsTrigger>
                  <TabsTrigger value="till">M-Pesa Till</TabsTrigger>
                </TabsList>
                <TabsContent value="paybill" className="mt-4">
                  <MpesaPaybillForm />
                </TabsContent>
                <TabsContent value="till" className="mt-4">
                  <MpesaTillForm />
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="branding" className="mt-4">
              <BrandingSettingsForm />
            </TabsContent>
          </motion.div>
        </Tabs>
      </main>
    </div>
  )
}