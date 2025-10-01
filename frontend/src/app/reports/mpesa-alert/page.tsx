"use client"

import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { getColumns } from "./columns"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"

// --- TYPE DEFINITIONS ---
interface MpesaAlert {
  _id: string;
  message: string;
  createdAt: string;
}

// --- MAIN COMPONENT ---
export default function MpesaAlertPage() {
  const { toast } = useToast()
  
  // Data states
  const [alerts, setAlerts] = useState<MpesaAlert[]>([])
  
  // UI states
  const [isLoading, setIsLoading] = useState(true)

  // --- DATA FETCHING ---
  const fetchAlerts = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Authentication token not found.')
      const response = await fetch('/api/reports/mpesa-alerts', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch alerts')
      setAlerts(await response.json())
    } catch {
      toast({ title: 'Error', description: 'Failed to load alerts.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast]);

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // --- EVENT HANDLERS ---
  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Authentication token not found.')
      const response = await fetch(`/api/reports/mpesa-alerts/${alertId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to delete alert')
      toast({ title: 'Alert Deleted', description: 'The alert has been successfully deleted.' })
      fetchAlerts()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete alert.', variant: 'destructive' })
    }
  }

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">M-Pesa Alerts</h1>
            <p className="text-sm text-zinc-400">
              Alerts for M-Pesa payments that failed to automatically reconnect a user.
            </p>
          </div>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 border-b border-zinc-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-cyan-400">Pending Alerts</CardTitle>
                <CardDescription className="text-zinc-400">These payments require manual review and action.</CardDescription>
              </div>
              <StatCard title="Pending Alerts" value={alerts.length} icon={AlertTriangle} color="text-yellow-400" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <p className="text-center text-zinc-400 py-8">Loading alerts...</p>
                ) : alerts.length === 0 ? (
                  <p className="text-center text-zinc-400 py-8">No pending alerts found.</p>
                ) : (
                  <DataTable columns={getColumns(handleDelete)} data={alerts} />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---
const StatCard = ({ title, value, icon: Icon, color = "text-white" }: any) => (
  <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-4">
    <div className={`p-2 bg-zinc-700 rounded-md ${color}`}><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);
