"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Topbar } from "@/components/topbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { DataTable } from "@/components/data-table"
import { columns } from "./columns"
import { SmsAcknowledgementForm, SmsAcknowledgementFormData } from "./sms-acknowledgement-form"
import { PlusCircle, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// --- TYPE DEFINITIONS ---
export type SmsAcknowledgement = {
  _id: string;
  triggerType: string;
  description?: string;
  smsTemplate: { _id: string; name: string; };
  status: 'Active' | 'Inactive';
  createdAt: string;
};

// --- MAIN COMPONENT ---
export default function SmsAcknowledgementsPage() {
  const { toast } = useToast()
  const { token } = useAuth()

  // Data states
  const [acknowledgements, setAcknowledgements] = useState<SmsAcknowledgement[]>([])
  
  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAcknowledgement, setSelectedAcknowledgement] = useState<SmsAcknowledgement | null>(null)

  // --- DATA FETCHING ---
  const fetchAcknowledgements = useCallback(async () => {
    if (!token) return
    try {
      const response = await fetch("/api/smsacknowledgements", { 
        headers: { "Authorization": `Bearer ${token}` } 
      })
      if (!response.ok) throw new Error("Failed to fetch acknowledgements")
      setAcknowledgements(await response.json())
    } catch {
      toast({ title: "Error", description: "Failed to load acknowledgements.", variant: "destructive" })
    }
  }, [token, toast])

  useEffect(() => {
    fetchAcknowledgements()
  }, [fetchAcknowledgements])

  // --- EVENT HANDLERS ---
  const handleNewAcknowledgement = () => {
    setSelectedAcknowledgement(null)
    setIsModalOpen(true)
  }

  const handleEdit = (acknowledgement: SmsAcknowledgement) => {
    setSelectedAcknowledgement(acknowledgement)
    setIsModalOpen(true)
  }

  const handleDelete = async (acknowledgement: SmsAcknowledgement) => {
    if (!window.confirm("Are you sure you want to delete this acknowledgement?")) return;
    try {
      if (!token) throw new Error("Authentication token not found")
      const response = await fetch(`/api/smsacknowledgements/${acknowledgement._id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to delete acknowledgement")
      toast({ title: "Success", description: "Acknowledgement deleted successfully." })
      fetchAcknowledgements()
    } catch {
      toast({ title: "Error", description: "Could not delete acknowledgement.", variant: "destructive" })
    }
  }

  const handleFormSubmit = async (data: SmsAcknowledgementFormData) => {
    const url = selectedAcknowledgement ? `/api/smsacknowledgements/${selectedAcknowledgement._id}` : "/api/smsacknowledgements"
    const method = selectedAcknowledgement ? "PUT" : "POST"
    
    try {
      if (!token) throw new Error("Authentication token not found")
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error((await response.json()).message || "Failed to save acknowledgement")
      
      toast({ title: "Success", description: `Acknowledgement ${selectedAcknowledgement ? 'updated' : 'created'} successfully.` })
      setIsModalOpen(false)
      fetchAcknowledgements()
    } catch (error: unknown) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : "An unknown error occurred.", variant: "destructive" })
    }
  }

  const activeAcknowledgements = acknowledgements.filter(a => a.status === 'Active').length
  const inactiveAcknowledgements = acknowledgements.length - activeAcknowledgements

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">SMS Acknowledgements</h1>
            <p className="text-sm text-zinc-400">Map system events to automated SMS templates.</p>
          </div>
          <Button onClick={handleNewAcknowledgement} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
            <PlusCircle className="mr-2 h-4 w-4" /> New Acknowledgement
          </Button>
        </div>

        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
          <Card className="bg-transparent border-none">
            <CardHeader className="p-4 border-b border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Mappings" value={acknowledgements.length} icon={PlusCircle} />
              <StatCard title="Active" value={activeAcknowledgements} icon={CheckCircle} color="text-green-400" />
              <StatCard title="Inactive" value={inactiveAcknowledgements} icon={XCircle} color="text-yellow-400" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <DataTable columns={columns({ handleEdit, handleDelete })} data={acknowledgements} filterColumn="triggerType" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-zinc-900/80 backdrop-blur-lg border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">{selectedAcknowledgement ? "Edit Acknowledgement" : "Create New Acknowledgement"}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Map a system trigger to an SMS template.
              </DialogDescription>
            </DialogHeader>
            <SmsAcknowledgementForm
              onSubmit={handleFormSubmit}
              initialData={selectedAcknowledgement ? { ...selectedAcknowledgement, smsTemplate: selectedAcknowledgement.smsTemplate._id } : null}
              onClose={() => setIsModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
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