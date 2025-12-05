"use client"

import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import StkPushForm from "@/components/stk-push-form"
import { motion } from "framer-motion"
import { PhoneOutgoing } from "lucide-react"

export default function StkPushPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">M-Pesa STK Push</h1>
            <p className="text-sm text-zinc-400">Initiate a payment prompt on a customer's phone.</p>
          </div>
        </div>

        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl max-w-md mx-auto"
        >
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <PhoneOutgoing className="w-5 h-5" />
                Initiate Payment
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Enter the customer's details to send a payment prompt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StkPushForm />
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}